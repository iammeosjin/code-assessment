import { ObjectId, ObjectType } from '@boomering/object-id';
import { Filter } from '@boomering/repository';
import { Inject, Injectable } from '@nestjs/common';
import { Tokens } from './libs/tokens';
import { Job, JobStatus, JobType } from './libs/types';
import { JobRepository } from './repositories/job.repository';

@Injectable()
export class JobService {
  constructor(
    @Inject(Tokens.JobRepository)
    private readonly jobs: JobRepository,
  ) {}

  async createJob(input: Omit<Job, 'id' | 'dateTimeCreated' | 'status'>) {
    const id = ObjectId.generate(ObjectType.Job);
    await this.jobs.create({
      ...input,
      status: JobStatus.Pending,
      dateTimeCreated: new Date(),
      id,
    });
  }

  async updateJob(
    id: ObjectId,
    input: Partial<Omit<Job, 'id' | 'dateTimeCreated'>>,
  ) {
    await this.jobs.update(id, input);
  }

  async addSendBirthdayMessageEntry(params: { user: ObjectId; dueDate: Date }) {
    const filter = {
      type: JobType.SendBirthdayMessage,
      dueDate: params.dueDate,
      status: { in: [JobStatus.Pending, JobStatus.Failed] },
    };
    const job = await this.jobs.findOne(filter);
    if (job) {
      const users: ObjectId[] = [...(job.data.users ?? []), params.user];
      return this.updateJob(job.id, {
        data: {
          users: Array.from(new Set<ObjectId>(users)),
        },
        dateTimeLastUpdated: new Date(),
      });
    }

    return this.createJob({
      type: JobType.SendBirthdayMessage,
      dueDate: params.dueDate,
      data: {
        users: [params.user],
      },
    });
  }

  async removeSendBirthdayMessageEntry(params: {
    user: ObjectId;
    dueDate: Date;
  }) {
    const filter = {
      type: JobType.SendBirthdayMessage,
      dueDate: params.dueDate,
      status: { notIn: [JobStatus.Processing] },
    };
    const job = await this.jobs.findOne(filter);
    if (!job) {
      return;
    }

    const users: ObjectId[] = job.data.users.filter(
      (user) => !user.equals(params.user),
    );

    return this.updateJob(job.id, {
      data: {
        users,
      },
      dateTimeLastUpdated: new Date(),
    });
  }

  findOne(filter: Filter<Job>) {
    return this.jobs.findOne(filter);
  }

  find(filter: Filter<Job>) {
    return this.jobs.find(filter);
  }

  async completeJob(id: ObjectId) {
    await this.updateJob(id, {
      status: JobStatus.Success,
      dateTimeSucceed: new Date(),
    });
  }

  async failJob(id: ObjectId, input: { error: string }) {
    await this.updateJob(id, {
      status: JobStatus.Failed,
      dateTimeFailed: new Date(),
      error: input.error,
    });
  }
}
