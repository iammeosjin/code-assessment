import { Module } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';
import { Tokens } from './libs/tokens';
import { MessageService } from './message.service';
import { MessageRepositoryFactory } from './repositories/message.repository';

@Module({
  providers: [
    {
      provide: Tokens.MessageRepository,
      useFactory: MessageRepositoryFactory,
      inject: [getConnectionToken()],
    },
    MessageService,
  ],
  exports: [MessageService],
})
export class MessageModule {}
