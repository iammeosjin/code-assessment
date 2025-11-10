import { ConfigService } from '@boomering/config';
import { faker } from '@faker-js/faker';
import { Test } from '@nestjs/testing';
import mongoose from 'mongoose';
import { SchedulerModule } from '../../src/apps/scheduler/scheduler.module';
import { testConfig } from '../helpers/config';

function uriWithDb(baseUri: string, dbName?: string) {
  const u = new URL(baseUri);
  const name =
    dbName || `test_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  u.pathname = `/${name}`;
  return u.toString();
}

export async function setupFixture(opts?: {
  mocks?: {
    type: unknown;
    value: unknown;
  }[];
  config?: Record<string, unknown>;
}) {
  const MONGODB_URI = uriWithDb(testConfig.MONGODB_URI);

  const config = {
    MONGODB_URI: MONGODB_URI,
    REQUEST_BIN_API_URL: faker.internet.url({ appendSlash: false }),
    ...opts?.config,
  };

  let builder = Test.createTestingModule({
    imports: [SchedulerModule],
  })
    .overrideProvider(ConfigService)
    .useValue(
      new ConfigService({
        data: config,
      }),
    );

  for (const { type, value } of opts?.mocks ?? []) {
    builder = builder.overrideProvider(type).useValue(value);
  }
  const module = await builder.compile();

  return {
    module,
    config,
    teardown: async () => {
      const conn = await mongoose.createConnection(MONGODB_URI).asPromise();
      await conn.dropDatabase();
      await conn.close();
      await module.close();
    },
  };
}
