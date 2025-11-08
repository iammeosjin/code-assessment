import { ObjectId } from '@boomering/object-id';
import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpException,
  HttpStatus,
  Param,
  Post,
  UsePipes,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { getTimeZones, TimeZone } from '@vvo/tzdb';
import { DateTime, IANAZone } from 'luxon';
import R from 'ramda';
import { JobService } from '../../../features/job/job.service';
import { User } from '../../../features/user/libs/types';
import { UserService } from '../../../features/user/user.service';
import { PostUserRequestDataDto } from '../dtos/post-user-request.dto';

@Controller('/')
@UsePipes()
export class UserController {
  private readonly timeZones: TimeZone[];

  constructor(
    private readonly user: UserService,
    private readonly job: JobService,
    private readonly config: ConfigService,
  ) {
    this.timeZones = getTimeZones();
  }

  @Post('/user')
  @HttpCode(200)
  async createUser(
    @Body() body: PostUserRequestDataDto,
  ): Promise<{ user: Omit<User, 'id'> & { id: string } }> {
    const location = body.location.toLowerCase();
    const timeZone = this.timeZones
      .filter(
        (z) =>
          z.name.toLowerCase().includes(location) ||
          z.mainCities?.some((c) => c.toLowerCase().includes(location)) ||
          z.countryName.toLowerCase().includes(location),
      )
      .slice(0, 20)
      .map((z) => {
        const valid = IANAZone.isValidZone(z.name);
        if (!valid) return null;
        return z.name;
      })
      .filter(R.identity)
      .pop();

    if (!timeZone) {
      throw new HttpException('Location not supported', HttpStatus.BAD_REQUEST);
    }

    const dateOfBirth = DateTime.fromJSDate(body.dateOfBirth, {
      zone: timeZone,
    });

    const dueDate = dateOfBirth
      .set({
        year: DateTime.now().setZone('utc').year,
        hour: parseInt(this.config.get('JOB_SCHEDULE_TIME') || '9'),
        minute: 0,
        second: 0,
        millisecond: 0,
      })
      .setZone('utc');

    const user = await this.user.createUser({
      dateOfBirth: dateOfBirth.toJSDate(),
      location: body.location,
      firstName: body.firstName,
      lastName: body.lastName,
      timeZone,
    });

    await this.job.addSendBirthdayMessageEntry({
      user: user.id,
      dueDate: dueDate.toJSDate(),
    });

    return {
      user: {
        ...user,
        id: user.id.toString(),
      },
    };
  }

  @Delete('/user/:user')
  async deleteUser(@Param('user') user: string): Promise<void> {
    await this.user.deleteUser(ObjectId.from(user));
  }
}
