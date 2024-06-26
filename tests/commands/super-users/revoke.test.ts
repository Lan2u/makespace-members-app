import * as O from 'fp-ts/Option';
import {faker} from '@faker-js/faker';
import {constructEvent} from '../../../src/types';
import {revoke} from '../../../src/commands/super-user/revoke';

describe('revoke-super-user', () => {
  describe('when the member is currently not a super user', () => {
    const memberNumber = faker.number.int();
    const result = revoke.process({
      command: {
        memberNumber,
        revokedAt: faker.date.soon(),
      },
      events: [],
    });

    it('does nothing', () => {
      expect(result).toStrictEqual(O.none);
    });
  });

  describe('when the member is already a super user', () => {
    const memberNumber = faker.number.int();
    const result = revoke.process({
      command: {
        memberNumber,
        revokedAt: faker.date.soon(),
      },
      events: [
        constructEvent('SuperUserDeclared')({
          memberNumber,
          declaredAt: faker.date.past(),
        }),
      ],
    });

    it('revokes their status', () => {
      expect(result).toStrictEqual(
        O.some(
          expect.objectContaining({type: 'SuperUserRevoked', memberNumber})
        )
      );
    });
  });

  describe('when the member was re-declared as a super user', () => {
    const memberNumber = faker.number.int();
    const result = revoke.process({
      command: {
        memberNumber,
        revokedAt: faker.date.soon(),
      },
      events: [
        constructEvent('SuperUserDeclared')({
          memberNumber,
          declaredAt: faker.date.past(),
        }),
        constructEvent('SuperUserRevoked')({
          memberNumber,
          revokedAt: faker.date.past(),
        }),
        constructEvent('SuperUserDeclared')({
          memberNumber,
          declaredAt: faker.date.past(),
        }),
      ],
    });

    it('revokes their status', () => {
      expect(result).toStrictEqual(
        O.some(
          expect.objectContaining({type: 'SuperUserRevoked', memberNumber})
        )
      );
    });
  });
});
