import { faker } from '@faker-js/faker';
import { DateTime } from 'luxon';
import { setupFixture } from './fixture';

describe('POST /user', () => {
  test.concurrent('create user', async () => {
    const { request, teardown } = await setupFixture();
    const body = JSON.stringify({
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      location: faker.location.country(),
      dateOfBirth: DateTime.now().toFormat('yyyy-MM-dd'),
    });

    const response = await request
      .post('/user')
      .set('Content-Type', 'application/json')
      .send(body);

    await teardown();
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('user.id');
  });
});
