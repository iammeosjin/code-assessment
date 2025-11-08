import { ObjectId } from '@boomering/object-id';

export type Message = {
  id: ObjectId;
  recipient: ObjectId;
  body: string;
  title: string;
  dateTimeCreated: Date;
};
