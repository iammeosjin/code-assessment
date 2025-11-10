import { ConfigModule, ConfigService } from '@boomering/config';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JobModule } from '../../features/job/job.module';
import { UserModule } from '../../features/user/user.module';
import { UserController } from './controllers/user.controller';

@Module({
  imports: [
    ConfigModule.forRoot(),
    MongooseModule.forRootAsync({
      useFactory: (config: ConfigService) => ({
        uri: config.getString('MONGODB_URI'),
      }),
      inject: [ConfigService],
    }),
    UserModule,
    JobModule,
  ],
  controllers: [UserController],
})
export class ApiModule {}
