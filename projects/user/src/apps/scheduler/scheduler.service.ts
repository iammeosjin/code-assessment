import { CatchError, gotry } from '@boomering/common';
import { ConfigService } from '@boomering/config';
import { ObjectId } from '@boomering/object-id';
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DateTime } from 'luxon';
import asyncMap from 'p-map';
import R from 'ramda';
import { JobService } from '../../features/job/job.service';
import { JobStatus, JobType } from '../../features/job/libs/types';
import { MessageService } from '../../features/message/message.service';
import { UserService } from '../../features/user/user.service';

@Injectable()
export class SchedulerService {
  constructor(
    private readonly job: JobService,
    private readonly user: UserService,
    private readonly message: MessageService,
    private readonly config: ConfigService,
  ) {}

  @Cron(CronExpression.EVERY_30_MINUTES)
  @CatchError(function (this: SchedulerService, error) {
    console.warn({
      name: 'SchedulerService#sendBirthdayMessage',
      error,
    });
  })
  async sendBirthdayMessage() {
    const now = DateTime.now().setZone('utc');

    const filter = {
      type: JobType.SendBirthdayMessage,
      dueDate: {
        lesserThanOrEqual: now.endOf('hour').minus({ minutes: 1 }).toJSDate(),
      },
      status: { in: [JobStatus.Pending, JobStatus.Failed] },
    };

    const jobs = await this.job.find(filter);

    for (const batch of R.splitEvery(5, jobs)) {
      await asyncMap(batch, async (job) => {
        if (!job?.data?.users?.length) return;

        const users = await this.user.find({
          id: { in: job.data.users.map((user) => ObjectId.from(user.buffer)) },
        });

        await this.job.processJob(job.id);

        const [, error] = await gotry(
          asyncMap(
            users,
            async (user) => {
              const message = await this.message.findOne({
                recipient: user.id,
              });

              if (
                message?.dateTimeCreated.getFullYear() ===
                new Date().getFullYear()
              )
                return;

              await this.message.sendBirthdayMessage({
                title: JobType.SendBirthdayMessage,
                recipient: user.id,
                fullName: `${user.firstName} ${user.lastName}`,
              });
            },
            {
              concurrency:
                this.config.getNumber('WORKER_CONCURRENCY', {
                  optional: true,
                }) || 2,
            },
          ),
        );

        if (error) {
          console.error(error);
          await this.job.failJob(job.id, { error: error.message });
          return;
        }
        await this.job.completeJob(job.id);
      });
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async updateJobs() {
    const now = DateTime.now().setZone('utc');

    const filter = {
      type: JobType.SendBirthdayMessage,
      dueDate: { lesserThanOrEqual: now.startOf('day').toJSDate() },
      status: { in: [JobStatus.Success] },
    };

    const jobs = await this.job.find(filter);

    const groupedJobs = jobs.reduce(
      (result, job) => {
        const key = job.dueDate.toISOString();
        const updatedJobs = result[key];

        if (!updatedJobs) {
          return {
            ...result,
            [key]: {
              dueDate: job.dueDate,
              users: job.data.users.map((user) => ObjectId.from(user.buffer)),
            },
          };
        }

        updatedJobs.users = Array.from(
          new Set<ObjectId>([
            ...updatedJobs.users.map((user) => ObjectId.from(user.buffer)),
            ...job.data.users.map((user) => ObjectId.from(user.buffer)),
          ]),
        );

        return result;
      },
      {} as Record<string, { dueDate: Date; users: ObjectId[] }>,
    );

    await asyncMap(
      Object.values(groupedJobs),
      async (job) => {
        await this.job.createJob({
          status: JobStatus.Success,
          dueDate: job.dueDate,
          data: { users: job.users },
          type: JobType.SendBirthdayMessage,
        });
      },
      {
        concurrency: 10,
      },
    );
    await this.job.deleteJob({ id: { in: jobs.map((job) => job.id) } });
  }
}
