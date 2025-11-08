import { ObjectId, ObjectType } from '@boomering/object-id';
import { Filter } from '@boomering/repository';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Tokens } from './libs/tokens';
import { Message } from './libs/types';
import { MessageRepository } from './repositories/message.repository';

@Injectable()
export class MessageService {
  constructor(
    @Inject(Tokens.MessageRepository)
    private readonly messages: MessageRepository,
    private readonly config: ConfigService,
  ) {}

  async createMessage(input: Omit<Message, 'id' | 'dateTimeCreated'>) {
    await this.messages.create({
      ...input,
      dateTimeCreated: new Date(),
      id: ObjectId.generate(ObjectType.Message),
    });
  }

  async updateMessage(
    id: ObjectId,
    input: Omit<Message, 'id' | 'dateTimeCreated'>,
  ) {
    await this.messages.update(id, input);
  }

  async sendBirthdayMessage(params: {
    recipient: ObjectId;
    fullName: string;
    title: string;
  }) {
    const body = `Hey, ${params.fullName} it’s your birthday`;

    const response = await fetch(`${this.config.get('REQUEST_BIN_API_URL')}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      mode: 'cors',
      body: JSON.stringify({
        message: body,
      }),
    });

    if (response.status !== 200) {
      throw new Error('Invalid Request');
    }

    await this.createMessage({
      recipient: params.recipient,
      body,
      title: params.title,
    });
  }

  findOne(filter: Filter<Message>) {
    return this.messages.findOne(filter);
  }
}
