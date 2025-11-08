import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';
import { DateTime, IANAZone } from 'luxon';

export function IsIanaTimezone(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isIanaTimezone',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          return typeof value === 'string' && IANAZone.isValidZone(value);
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a valid IANA timezone`;
        },
      },
    });
  };
}

export function IsISO8601(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isISO8601',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          console.log('validate', value);
          return (
            typeof value === 'string' &&
            DateTime.fromFormat(value, 'yyyy-MM-dd').isValid
          );
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be in yyyy-MM-dd format`;
        },
      },
    });
  };
}
