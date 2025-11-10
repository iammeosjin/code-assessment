import { faker } from '@faker-js/faker';
import { DateTime } from 'luxon';
import { fetch, MockAgent, setGlobalDispatcher } from 'undici';
import { SchedulerService } from '../../src/apps/scheduler/scheduler.service';
import { JobService } from '../../src/features/job/job.service';
import { JobStatus, JobType } from '../../src/features/job/libs/types';
import { MessageService } from '../../src/features/message/message.service';
import { UserService } from '../../src/features/user/user.service';
import { setupFixture } from './fixture';

const agent = new MockAgent();
agent.disableNetConnect();
setGlobalDispatcher(agent);
Object.assign(global, { fetch });

describe('Scheduler#sendBirthdayMessage', () => {
  test.concurrent('given empty jobs', async () => {
    const sendBirthdayMessageMock = jest.fn();
    const { teardown, module } = await setupFixture({
      mocks: [
        {
          type: MessageService,
          value: {
            sendBirthdayMessage: sendBirthdayMessageMock,
          },
        },
      ],
    });

    const schedulerService = module.get<SchedulerService>(SchedulerService);
    const userService = module.get<UserService>(UserService);

    await userService.createUser({
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      location: faker.location.country(),
      dateOfBirth: DateTime.now().toJSDate(),
      timeZone: 'Asia/Manila',
    });

    await schedulerService.sendBirthdayMessage();

    await teardown();

    expect(sendBirthdayMessageMock).toHaveBeenCalledTimes(0);
  });

  test.concurrent('given pending job', async () => {
    const { teardown, config, module } = await setupFixture();

    agent
      .get(config.REQUEST_BIN_API_URL)
      .intercept({ path: '/', method: 'POST' })
      .reply(200);

    const schedulerService = module.get<SchedulerService>(SchedulerService);
    const jobService = module.get<JobService>(JobService);
    const userService = module.get<UserService>(UserService);
    const messageService = module.get<MessageService>(MessageService);

    const user = await userService.createUser({
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      location: faker.location.country(),
      dateOfBirth: DateTime.now().toJSDate(),
      timeZone: 'Asia/Manila',
    });

    const job = await jobService.createJob({
      type: JobType.SendBirthdayMessage,
      data: {
        users: [user.id],
      },
      dueDate: DateTime.now().toJSDate(),
    });

    const sendBirthdayMessageMock = jest.spyOn(
      messageService,
      'sendBirthdayMessage',
    );

    await schedulerService.sendBirthdayMessage();

    const updatedJob = await jobService.findOne({ id: job.id });

    await teardown();

    expect(updatedJob).toHaveProperty('status', JobStatus.Success);
    expect(sendBirthdayMessageMock).toHaveBeenCalled();
  });

  test.concurrent('given processing job', async () => {
    const sendBirthdayMessageMock = jest.fn();
    const { teardown, module } = await setupFixture({
      mocks: [
        {
          type: MessageService,
          value: {
            sendBirthdayMessage: sendBirthdayMessageMock,
          },
        },
      ],
    });

    const schedulerService = module.get<SchedulerService>(SchedulerService);
    const userService = module.get<UserService>(UserService);
    const jobService = module.get<JobService>(JobService);

    const user = await userService.createUser({
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      location: faker.location.country(),
      dateOfBirth: DateTime.now().toJSDate(),
      timeZone: 'Asia/Manila',
    });

    await jobService.createJob({
      type: JobType.SendBirthdayMessage,
      status: JobStatus.Processing,
      data: {
        users: [user.id],
      },
      dueDate: DateTime.now().toJSDate(),
    });

    await schedulerService.sendBirthdayMessage();

    await teardown();

    expect(sendBirthdayMessageMock).toHaveBeenCalledTimes(0);
  });

  test.concurrent('given message already sent', async () => {
    const { teardown, module } = await setupFixture();

    const schedulerService = module.get<SchedulerService>(SchedulerService);
    const userService = module.get<UserService>(UserService);
    const jobService = module.get<JobService>(JobService);
    const messageService = module.get<MessageService>(MessageService);

    const user = await userService.createUser({
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      location: faker.location.country(),
      dateOfBirth: DateTime.now().toJSDate(),
      timeZone: 'Asia/Manila',
    });

    await jobService.createJob({
      type: JobType.SendBirthdayMessage,
      status: JobStatus.Failed,
      data: {
        users: [user.id],
      },
      dueDate: DateTime.now().toJSDate(),
    });

    await messageService.createMessage({
      recipient: user.id,
      body: faker.lorem.sentence(),
      title: JobType.SendBirthdayMessage,
    });

    const sendBirthdayMessageMock = jest.spyOn(
      messageService,
      'sendBirthdayMessage',
    );

    await schedulerService.sendBirthdayMessage();

    await teardown();

    expect(sendBirthdayMessageMock).toHaveBeenCalledTimes(0);
  });

  test.concurrent('given failed job', async () => {
    const { teardown, config, module } = await setupFixture();

    agent
      .get(config.REQUEST_BIN_API_URL)
      .intercept({ path: '/', method: 'POST' })
      .reply(200);

    const schedulerService = module.get<SchedulerService>(SchedulerService);
    const jobService = module.get<JobService>(JobService);
    const userService = module.get<UserService>(UserService);

    const user = await userService.createUser({
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      location: faker.location.country(),
      dateOfBirth: DateTime.now().toJSDate(),
      timeZone: 'Asia/Manila',
    });

    const job = await jobService.createJob({
      type: JobType.SendBirthdayMessage,
      status: JobStatus.Failed,
      data: {
        users: [user.id],
      },
      dueDate: DateTime.now().toJSDate(),
    });

    await schedulerService.sendBirthdayMessage();

    const updatedJob = await jobService.findOne({ id: job.id });

    await teardown();

    expect(updatedJob).toHaveProperty('status', JobStatus.Success);
  });

  test.concurrent('unsuccessful message request', async () => {
    const { teardown, config, module } = await setupFixture();

    agent
      .get(config.REQUEST_BIN_API_URL)
      .intercept({ path: '/', method: 'POST' })
      .reply(400);

    const schedulerService = module.get<SchedulerService>(SchedulerService);
    const jobService = module.get<JobService>(JobService);
    const userService = module.get<UserService>(UserService);

    const user = await userService.createUser({
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      location: faker.location.country(),
      dateOfBirth: DateTime.now().toJSDate(),
      timeZone: 'Asia/Manila',
    });

    const job = await jobService.createJob({
      type: JobType.SendBirthdayMessage,
      data: {
        users: [user.id],
      },
      dueDate: DateTime.now().toJSDate(),
    });

    await schedulerService.sendBirthdayMessage();

    const updatedJob = await jobService.findOne({ id: job.id });

    await teardown();

    expect(updatedJob).toHaveProperty('status', JobStatus.Failed);
  });
});
