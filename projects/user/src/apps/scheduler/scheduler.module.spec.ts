import { ConfigService } from '@boomering/config';
import { Test } from '@nestjs/testing';
import { SchedulerModule } from './scheduler.module';

describe('SchedulerModule', () => {
  test.concurrent('init', async () => {
    const module = await Test.createTestingModule({
      imports: [SchedulerModule],
    })
      .overrideProvider(ConfigService)
      .useValue(
        new ConfigService({
          data: {
            MONGODB_URI: 'mongodb://localhost:27017',
          },
        }),
      )
      .compile();

    await expect(module.init()).resolves.toBeTruthy();
    await expect(module.close()).resolves.toBeUndefined();
  });
});
