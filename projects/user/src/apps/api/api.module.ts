import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { JobModule } from '../../features/job/job.module';
import { SchedulerModule } from '../../features/scheduler/scheduler.module';
import { UserModule } from '../../features/user/user.module';
import { UserController } from './controllers/user.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('MONGODB_URI'),
      }),
      inject: [ConfigService],
    }),
    UserModule,
    JobModule,
    SchedulerModule,
  ],
  controllers: [UserController],
})
export class ApiModule {}
