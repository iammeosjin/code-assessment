import { Transform } from 'class-transformer';
import { IsISO8601, IsString } from 'class-validator';
import { DateTime } from 'luxon';
import { IsIanaTimezone } from '../decorators/is-iana-timezone';

export class PostUserRequestDataDto {
  @IsString()
  readonly firstName: string;

  @IsString()
  readonly lastName: string;

  @IsISO8601()
  @Transform(({ value }) => DateTime.fromISO(value as string))
  readonly dateOfBirth: DateTime;

  @IsIanaTimezone()
  location: string;
}
