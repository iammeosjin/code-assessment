import { faker } from '@faker-js/faker';
import { DateTime } from 'luxon';

export default function generateUser() {
  return {
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    location: faker.location.country(),
    dateOfBirth: DateTime.now().toFormat('yyyy-MM-dd'),
  };
}
