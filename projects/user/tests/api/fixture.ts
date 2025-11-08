import { faker } from '@faker-js/faker';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { backOff } from 'exponential-backoff';
import mongoose from 'mongoose';
import supertest from 'supertest';
import { ApiModule } from '../../src/apps/api/api.module';
import { getPort } from './helpers/get-port';

export async function setupFixture(opts?: {
  mocks?: {
    type: unknown;
    value: unknown;
  }[];
  config?: Record<string, unknown>;
}) {
  const config = {
    MONGODB_URI: `mongodb://localhost:27017/${faker.string.alpha()}`,
    ...opts?.config,
  };

  let builder = Test.createTestingModule({
    imports: [ApiModule],
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

  const [port, app] = await backOff(async () => {
    const port = await getPort();

    const app = module.createNestApplication({
      rawBody: true,
    });

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
        forbidUnknownValues: true,
      }),
    );

    await app.listen(port);

    return [port, app];
  });

  return {
    request: supertest(app.getHttpServer()),
    module,
    port,
    teardown: async () => {
      const testDb = mongoose.createConnection(config.MONGODB_URI);
      await testDb.dropDatabase();
      await app.close();
      await mongoose.disconnect();
    },
  };
}
