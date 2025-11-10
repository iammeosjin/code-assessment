import { ObjectId, ObjectType } from '@boomering/object-id';
import { faker } from '@faker-js/faker';
import R from 'ramda';
import { Job, JobStatus, JobType } from '../../src/features/job/libs/types';

export default function generateJob(params?: Partial<Job>): Job {
  return {
    id: ObjectId.generate(ObjectType.Job),
    type: JobType.SendBirthdayMessage,
    status: faker.helpers.arrayElement(Object.values(JobStatus)),
    data: {
      users: R.times(
        () => ObjectId.generate(ObjectType.User),
        faker.number.int({ min: 1, max: 10 }),
      ),
    },
    dueDate: new Date(),
    dateTimeCreated: new Date(),
    ...(params || {}),
  };
}
