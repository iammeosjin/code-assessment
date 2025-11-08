import { gotry } from '@boomering/common';
import { ObjectId } from '@boomering/object-id';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DateTime } from 'luxon';
import asyncMap from 'p-map';
import R from 'ramda';
import { JobService } from '../job/job.service';
import { JobStatus, JobType } from '../job/libs/types';
import { MessageService } from '../message/message.service';
import { UserService } from '../user/user.service';

@Injectable()
export class SchedulerService {
  constructor(
    private readonly job: JobService,
    private readonly user: UserService,
    private readonly message: MessageService,
    private readonly config: ConfigService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async sendBirthdayMessage() {
    const now = DateTime.now().setZone('utc');

    const filter = {
      type: JobType.SendBirthdayMessage,
      dueDate: { lesserThanOrEqual: now.startOf('hour').toJSDate() },
      status: { in: [JobStatus.Pending, JobStatus.Failed] },
    };

    const jobs = await this.job.find(filter);

    for (const batch of R.splitEvery(5, jobs)) {
      await asyncMap(batch, async (job) => {
        if (!job?.data?.users?.length) return;

        const users = await this.user.find({
          id: { in: job.data.users.map((user) => ObjectId.from(user.buffer)) },
        });

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
              concurrency: parseInt(
                this.config.get('WORKER_CONCURRENCY') || '2',
              ),
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
      (groupedJobs, job) => {
        const updatedJobs = groupedJobs[job.dueDate.toISOString()];

        if (!updatedJobs) {
          return {
            [job.dueDate.toISOString()]: {
              dueDate: job.dueDate,
              users: job.data.users,
            },
          };
        }

        updatedJobs.users = Array.from(
          new Set<ObjectId>([...updatedJobs.users, ...job.data.users]),
        );

        return groupedJobs;
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
