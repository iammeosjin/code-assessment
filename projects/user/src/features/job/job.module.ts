import { Module } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';
import { JobService } from './job.service';
import { Tokens } from './libs/tokens';
import { JobRepositoryFactory } from './repositories/job.repository';

@Module({
  providers: [
    {
      provide: Tokens.JobRepository,
      useFactory: JobRepositoryFactory,
      inject: [getConnectionToken()],
    },
    JobService,
  ],
  exports: [JobService],
})
export class JobModule {}
