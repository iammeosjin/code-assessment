import { faker } from '@faker-js/faker';
import { DateTime } from 'luxon';
import { Tokens } from '../../src/features/user/libs/tokens';
import { UserRepository } from '../../src/features/user/repositories/user.repository';
import { setupFixture } from './fixture';

describe('DELETE /user', () => {
  test.concurrent('delete user', async () => {
    const { request, teardown, module } = await setupFixture();
    const body = {
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      location: faker.location.country(),
      dateOfBirth: DateTime.now().toFormat('yyyy-MM-dd'),
    };
    const createUserResponse = await request
      .post('/user')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify(body));

    const response = await request
      .delete(`/user/${createUserResponse.body.user.id}`)
      .set('Content-Type', 'application/json')
      .send();

    const repository = module.get<UserRepository>(Tokens.UserRepository);
    const user = await repository.findOne({
      firstName: body.firstName,
      lastName: body.lastName,
    });

    await teardown();
    expect(response.status).toBe(200);
    expect(user).toBeNull();
  });
});
