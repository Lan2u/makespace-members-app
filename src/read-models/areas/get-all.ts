import {pipe} from 'fp-ts/lib/function';
import {DomainEvent, SubsetOfDomainEvent, filterByName} from '../../types';
import * as RA from 'fp-ts/ReadonlyArray';
import {Area} from './area';

const pertinentEvents = ['AreaCreated' as const, 'OwnerAdded' as const];

const updateAreas = (
  state: Map<string, Area>,
  event: SubsetOfDomainEvent<typeof pertinentEvents>
) => {
  switch (event.type) {
    case 'AreaCreated':
      state.set(event.id, {...event, owners: []});
      return state;
    case 'OwnerAdded': {
      const current = state.get(event.areaId);
      if (!current) {
        return state;
      }
      state.set(event.areaId, {
        ...current,
        owners: [...current.owners, event.memberNumber],
      });
      return state;
    }
  }
};

export const getAll = (
  events: ReadonlyArray<DomainEvent>
): ReadonlyArray<Area> =>
  pipe(
    events,
    filterByName(pertinentEvents),
    RA.reduce(new Map<string, Area>(), updateAreas),
    map => Array.from(map.values())
  );
