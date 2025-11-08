import { MongooseRepository, Repository } from '@boomering/repository';
import { Connection } from 'mongoose';
import { Message } from '../libs/types';

export type MessageRepository = Repository<Message>;

export function MessageRepositoryFactory(
  connection: Connection,
): MessageRepository {
  return new MongooseRepository<Message>(
    connection,
    'Message',
    {
      _id: Buffer,
      recipient: Buffer,
      body: String,
      title: String,
      dateTimeCreated: Date,
    },
    [[{ recipient: 1, dateTimeCreated: -1 }]],
  );
}
