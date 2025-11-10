import { ConfigModule, ConfigService } from '@boomering/config';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { JobModule } from '../../features/job/job.module';
import { MessageModule } from '../../features/message/message.module';
import { UserModule } from '../../features/user/user.module';
import { SchedulerService } from './scheduler.service';

@Module({
  imports: [
    ConfigModule.forRoot(),
    MongooseModule.forRootAsync({
      useFactory: (config: ConfigService) => {
        return {
          uri: config.getString('MONGODB_URI'),
        };
      },
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
