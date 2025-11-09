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

  test.concurrent('create duplicate user', async () => {
    const { request, teardown } = await setupFixture();
    const body = {
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      location: faker.location.country(),
      dateOfBirth: DateTime.now().toFormat('yyyy-MM-dd'),
    };

    await request
      .post('/user')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify(body));

    const response = await request
      .post('/user')
      .set('Content-Type', 'application/json')
      .send(
        JSON.stringify({
          ...body,
          location: faker.location.country(),
          dateOfBirth: DateTime.now()
            .minus({ years: 11 })
            .toFormat('yyyy-MM-dd'),
        }),
      );

    await teardown();
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('message', 'User already exists');
  });

  describe('invalid requests', () => {
    test.concurrent.each([
      {
        lastName: faker.person.lastName(),
        location: faker.location.country(),
        dateOfBirth: DateTime.now().toFormat('yyyy-MM-dd'),
      },
      {
        firstName: faker.person.firstName(),
        location: faker.location.country(),
        dateOfBirth: DateTime.now().toFormat('yyyy-MM-dd'),
      },
      {
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        dateOfBirth: DateTime.now().toFormat('yyyy-MM-dd'),
      },
      {
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        location: faker.location.country(),
      },
      {
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        location: 'invalid location',
        dateOfBirth: DateTime.now().toFormat('yyyy-MM-dd'),
      },
    ])('invalid request body %p', async (body) => {
      const { request, teardown } = await setupFixture();
      const response = await request
        .post('/user')
        .set('Content-Type', 'application/json')
        .send(JSON.stringify(body));

      await teardown();
      expect(response.status).toBe(400);
    });
  });
});
