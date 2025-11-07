import { ObjectId } from '@boomering/object-id';

export type User = {
  id: ObjectId;
  firstName: string;
  lastName: string;
  birthMonthAndDay: string;
  birthYear: number;
  location: string;
};
