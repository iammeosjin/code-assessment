/* eslint-disable @typescript-eslint/no-floating-promises */
import { ShutdownSignal, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { Server } from 'http';

import { ApiModule } from './apps/api/api.module';
import { options } from './program';

const SHUTDOWN_SIGNALS = [
  ShutdownSignal.SIGHUP,
  ShutdownSignal.SIGINT,
  ShutdownSignal.SIGTERM,
];

async function bootstrap() {
  if (options.mode === 'api') {
    const app = await NestFactory.create(ApiModule, {
      rawBody: true,
    });

    app.enableShutdownHooks(SHUTDOWN_SIGNALS);
    app.setGlobalPrefix('v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
        forbidUnknownValues: true,
      }),
    );

    const port = parseInt(process.env.PORT || '3000', 10);

    const server: Server = app.getHttpAdapter().getHttpServer();
    server.keepAliveTimeout = 35 * 1000;
    server.headersTimeout = 40 * 1000;
    console.log('starting at port', port);
    await app.listen(port);
  }
}

bootstrap();
