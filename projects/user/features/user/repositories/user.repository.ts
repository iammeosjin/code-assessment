import { MongooseRepository, Repository } from '@boomering/repository';
import { Connection } from 'mongoose';
import { User } from '../libs/types';

export type UserRepository = Repository<User>;

export function UserRepositoryFactory(connection: Connection): UserRepository {
  return new MongooseRepository<User>(
    connection,
    'User',
    {
      _id: Buffer,
      firstName: String,
      lastName: String,
      location: String,
      dateOfBirth: Date,
      timeZone: String,
      dateTimeCreated: Date,
      dateTimeLastUpdated: Date,
    },
    [[{ firstName: 1, lastName: 1 }, { unique: true }]],
  );
}
