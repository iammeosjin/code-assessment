import { Type } from 'class-transformer';
import { IsDate, IsString } from 'class-validator';

export class PostUserRequestDataDto {
  @IsString()
  readonly firstName!: string;

  @IsString()
  readonly lastName!: string;

  @IsDate()
  @Type(() => Date)
  readonly dateOfBirth!: Date;

  @IsString()
  readonly location!: string;
}
