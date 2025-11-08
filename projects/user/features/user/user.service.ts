import { ObjectId, ObjectType } from '@boomering/object-id';
import { Filter } from '@boomering/repository';
import { Inject, Injectable } from '@nestjs/common';
import { Tokens } from './libs/tokens';
import { User } from './libs/types';
import { UserRepository } from './repositories/user.repository';

@Injectable()
export class UserService {
  constructor(
    @Inject(Tokens.UserRepository)
    private readonly users: UserRepository,
  ) {}

  async createUser(
    input: Omit<User, 'id' | 'dateTimeCreated' | 'dateTimeLastUpdated'>,
  ) {
    const id = ObjectId.generate(ObjectType.User);
    const user = {
      ...input,
      dateTimeCreated: new Date(),
      id,
    };
    await this.users.create(user);

    return user;
  }

  async deleteUser(id: ObjectId) {
    await this.users.delete(id);
  }

  find(filter: Filter<User>) {
    return this.users.find(filter);
  }
}
