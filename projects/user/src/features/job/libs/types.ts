import { ObjectId } from '@boomering/object-id';

export enum JobType {
  SendBirthdayMessage = 'SEND_BIRTHDAY_MESSAGE',
}

export type SendBirthdayMessageData = {
  users: ObjectId[];
};

export enum JobStatus {
  Pending = 'PENDING',
  Processing = 'PROCESSING',
  Success = 'SUCCESS',
  Failed = 'FAILED',
}

export type Job = {
  id: ObjectId;
  status: JobStatus;
  type: JobType;
  data: SendBirthdayMessageData;
  dueDate: Date;
  dateTimeCreated: Date;
  dateTimeLastUpdated?: Date;
  dateTimeSucceed?: Date;
  dateTimeFailed?: Date;
  error?: string;
};
