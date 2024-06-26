import {faker} from '@faker-js/faker';
import {DomainEvent} from '../../../src/types';
import {TestFramework, initTestFramework} from '../test-framework';
import {NonEmptyString, UUID} from 'io-ts-types';
import {getAll} from '../../../src/read-models/equipment/get-all';

describe('get-all', () => {
  let events: ReadonlyArray<DomainEvent>;
  let framework: TestFramework;
  beforeEach(async () => {
    framework = await initTestFramework();
  });

  describe('when equipment is added to existing area', () => {
    const createArea = {
      id: faker.string.uuid() as UUID,
      name: faker.company.buzzNoun() as NonEmptyString,
      description: faker.company.buzzPhrase(),
    };
    const addEquipment = {
      id: faker.string.uuid() as UUID,
      name: faker.company.buzzNoun() as NonEmptyString,
      areaId: createArea.id,
    };
    beforeEach(async () => {
      await framework.commands.area.create(createArea);
      await framework.commands.equipment.add(addEquipment);
      events = await framework.getAllEvents();
    });

    it('returns the equipment with the area name', () => {
      const allEquipment = getAll(events);
      expect(allEquipment[0].id).toStrictEqual(addEquipment.id);
      expect(allEquipment[0].areaName).toStrictEqual(createArea.name);
    });
  });

  describe('when equipment is added to non-existant area', () => {
    const addEquipment = {
      id: faker.string.uuid() as UUID,
      name: faker.company.buzzNoun() as NonEmptyString,
      areaId: faker.string.uuid() as UUID,
    };
    beforeEach(async () => {
      await framework.commands.equipment.add(addEquipment);
      events = await framework.getAllEvents();
    });

    it('omits the equipment', () => {
      const allEquipment = getAll(events);
      expect(allEquipment).toHaveLength(0);
    });
  });
});
