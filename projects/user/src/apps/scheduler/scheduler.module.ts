import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { JobModule } from '../../features/job/job.module';
import { MessageModule } from '../../features/message/message.module';
import { UserModule } from '../../features/user/user.module';
import { SchedulerService } from './scheduler.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('MONGODB_URI'),
      }),
      inject: [ConfigService],
    }),
    ScheduleModule.forRoot(),
    JobModule,
    UserModule,
    MessageModule,
  ],
  providers: [SchedulerService],
})
export class SchedulerModule {}
