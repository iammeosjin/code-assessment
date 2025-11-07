import { ObjectId, ObjectType } from '@boomering/object-id';
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

  async createUser(input: Omit<User, 'id'>) {
    const id = ObjectId.generate(ObjectType.User);
    await this.users.create({
      ...input,
      id,
    });
  }

  async deleteUser(id: ObjectId) {
    await this.users.delete(id);
  }
}
