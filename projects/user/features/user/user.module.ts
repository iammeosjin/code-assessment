import { Module } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';
import { Tokens } from './libs/tokens';
import { UserRepositoryFactory } from './repositories/user.repository';
import { UserService } from './user.service';

@Module({
  providers: [
    {
      provide: Tokens.UserRepository,
      useFactory: UserRepositoryFactory,
      inject: [getConnectionToken()],
    },
    UserService,
  ],
  exports: [UserService],
})
export class UserModule {}
