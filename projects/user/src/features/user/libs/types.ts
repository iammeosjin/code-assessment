import { ObjectId } from '@boomering/object-id';

export type User = {
  id: ObjectId;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  location: string;
  timeZone: string;
  dateTimeCreated: Date;
  dateTimeLastUpdated?: Date;
};
