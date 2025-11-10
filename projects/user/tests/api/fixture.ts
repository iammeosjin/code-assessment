import { ConfigService } from '@boomering/config';
import { ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { backOff } from 'exponential-backoff';
import mongoose from 'mongoose';
import supertest from 'supertest';
import { ApiModule } from '../../src/apps/api/api.module';
import { testConfig } from '../helpers/config';
import { getPort } from './helpers/get-port';

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
      const conn = await mongoose.createConnection(MONGODB_URI).asPromise();
      await conn.dropDatabase();
      await conn.close();
      await app.close();
    },
  };
}
