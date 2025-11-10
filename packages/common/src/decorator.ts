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

export function CatchError<A extends unknown[]>(
  handler?: (error: Error, ...args: A) => void | Promise<void>,
) {
  return function (_: unknown, __: string, descriptor: PropertyDescriptor) {
    const original = descriptor.value;

    descriptor.value = async function (...args: A) {
      try {
        const result = original.apply(this, args);

        if (result['then']) {
          await result;
        }

        return result;
      } catch (error) {
        if (handler) {
          await handler.apply(this, [error as Error, ...args]);
        }
      }
    };

    return descriptor;
  };
}
