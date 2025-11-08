import { MongooseRepository, Repository } from '@boomering/repository';
import { Connection, Schema } from 'mongoose';
import { Job } from '../libs/types';

export type JobRepository = Repository<Job>;

export function JobRepositoryFactory(connection: Connection): JobRepository {
  return new MongooseRepository<Job>(
    connection,
    'Job',
    {
      _id: Buffer,
      status: String,
      type: String,
      data: Schema.Types.Mixed,
      dueDate: Date,
      dateTimeCreated: Date,
      dateTimeLastUpdated: Date,
      dateTimeSucceed: Date,
      dateTimeFailed: Date,
      error: String,
    },
    [[{ dueDate: -1, type: 1, status: 1 }], [{ dueDate: -1, type: 1 }]],
  );
}
