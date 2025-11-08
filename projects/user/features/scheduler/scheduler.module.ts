import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { JobModule } from '../job/job.module';
import { MessageModule } from '../message/message.module';
import { UserModule } from '../user/user.module';
import { SchedulerService } from './scheduler.service';

@Module({
  imports: [
    ConfigModule,
    ScheduleModule.forRoot(),
    JobModule,
    UserModule,
    MessageModule,
  ],
  providers: [SchedulerService],
})
export class SchedulerModule {}
