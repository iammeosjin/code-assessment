import { ObjectId } from '@boomering/object-id';
import {
  Body,
  Controller,
  Delete,
  Param,
  Post,
  UsePipes,
} from '@nestjs/common';
import { UserService } from '../../../features/user/user.service';
import { PostUserRequestDataDto } from '../dtos/post-user-request.dto';

@Controller('/')
@UsePipes()
export class UserController {
  constructor(private readonly user: UserService) {}

  @Post('/user')
  async createUser(@Body() body: PostUserRequestDataDto): Promise<void> {
    const birthMonthAndDay = `${body.dateOfBirth.day}-${body.dateOfBirth.month}`;
    const birthYear = body.dateOfBirth.year;
    await this.user.createUser({
      birthMonthAndDay,
      birthYear,
      location: body.location,
      firstName: body.firstName,
      lastName: body.lastName,
    });
  }

  @Delete('/user/:user')
  async deleteUser(@Param('user') user: string): Promise<void> {
    await this.user.deleteUser(ObjectId.from(user));
  }
}
