import { DateTime } from 'luxon';
import { fetch, MockAgent, setGlobalDispatcher } from 'undici';
import { SchedulerService } from '../../src/apps/scheduler/scheduler.service';
import { JobService } from '../../src/features/job/job.service';
import { JobStatus, JobType } from '../../src/features/job/libs/types';
import generateJob from '../helpers/generate-job';
import { setupFixture } from './fixture';

const agent = new MockAgent();
agent.disableNetConnect();
setGlobalDispatcher(agent);
Object.assign(global, { fetch });

describe('Scheduler#updateJobs', () => {
  test.concurrent('given existing successful jobs', async () => {
    const { teardown, module } = await setupFixture();

    const schedulerService = module.get<SchedulerService>(SchedulerService);
    const jobService = module.get<JobService>(JobService);
    const dueDate = DateTime.now().minus({ days: 1 }).toJSDate();
    const jobs = await Promise.all(
      [
        generateJob({ dueDate, status: JobStatus.Success }),
        generateJob({ dueDate, status: JobStatus.Success }),
      ].map((job) => jobService.createJob(job)),
    );

    await schedulerService.updateJobs();

    const updatedJobs = await jobService.find({
      id: { in: jobs.map((job) => job.id) },
    });

    const successfulJobs = await jobService.find({
      type: JobType.SendBirthdayMessage,
      dueDate,
      status: JobStatus.Success,
    });

    await teardown();

    expect(updatedJobs.length).toBe(0);
    expect(successfulJobs.length).toBe(1);
    expect(successfulJobs[0].data.users.length).toBe(
      jobs.reduce((sum, job) => sum + job.data.users.length, 0),
    );
    jobs.forEach((job) => {
      job.data.users.forEach((user) => {
        expect(
          successfulJobs[0].data.users.some((u) =>
            u.buffer.equals(user.buffer),
          ),
        ).toBeTruthy();
      });
    });
  });

  test.concurrent('given successful jobs with different due date', async () => {
    const { teardown, module } = await setupFixture();

    const schedulerService = module.get<SchedulerService>(SchedulerService);
    const jobService = module.get<JobService>(JobService);
    const jobs = await Promise.all(
      [
        generateJob({
          dueDate: DateTime.now().minus({ days: 1 }).toJSDate(),
          status: JobStatus.Success,
        }),
        generateJob({
          dueDate: DateTime.now().minus({ days: 2 }).toJSDate(),
          status: JobStatus.Success,
        }),
      ].map((job) => jobService.createJob(job)),
    );

    await schedulerService.updateJobs();

    const updatedJobs = await jobService.find({
      id: { in: jobs.map((job) => job.id) },
    });

    const successfulJobs = await jobService.find({
      type: JobType.SendBirthdayMessage,
      status: JobStatus.Success,
    });

    await teardown();

    expect(updatedJobs.length).toBe(0);
    expect(successfulJobs.length).toBe(2);
  });

  test.concurrent('given non-successful job', async () => {
    const { teardown, module } = await setupFixture();

    const schedulerService = module.get<SchedulerService>(SchedulerService);
    const jobService = module.get<JobService>(JobService);
    const dueDate = DateTime.now().minus({ days: 1 }).toJSDate();
    const jobs = await Promise.all(
      [
        generateJob({ dueDate, status: JobStatus.Success }),
        generateJob({ dueDate, status: JobStatus.Success }),
        generateJob({ dueDate, status: JobStatus.Pending }),
      ].map((job) => jobService.createJob(job)),
    );

    await schedulerService.updateJobs();

    const updatedJobs = await jobService.find({
      id: { in: jobs.map((job) => job.id) },
    });

    const successfulJobs = await jobService.find({
      type: JobType.SendBirthdayMessage,
      dueDate,
      status: JobStatus.Success,
    });

    await teardown();

    expect(updatedJobs.length).toBe(1);
    expect(successfulJobs.length).toBe(1);
    expect(successfulJobs[0].data.users.length).toBe(
      jobs
        .filter((job) => job.status === JobStatus.Success)
        .reduce((sum, job) => sum + job.data.users.length, 0),
    );
  });
});
