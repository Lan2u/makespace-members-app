import * as TE from 'fp-ts/TaskEither';
import {getAllEvents} from '../../src/init-dependencies/event-store/get-all-events';
import {initQueryEventsDatabase} from '../../src/init-dependencies/event-store/init-events-database';
import {ensureEventTableExists} from '../../src/init-dependencies/event-store/ensure-event-table-exists';
import {DomainEvent} from '../../src/types';
import {shouldNotBeCalled} from '../should-not-be-called.helper';
import {pipe} from 'fp-ts/lib/function';
import {commands} from '../../src/commands';
import {persistOrNoOp} from '../../src/commands/api-post';
import {commitEvent} from '../../src/init-dependencies/event-store/commit-event';
import {Command} from '../../src/types/command';

type ToFrameworkCommands<T> = {
  [K in keyof T]: {
    [M in keyof T[K]]: T[K][M] extends {
      process: (input: {
        command: infer C;
        events: ReadonlyArray<DomainEvent>;
      }) => unknown;
    }
      ? (c: C) => Promise<void>
      : never;
  };
};
export type TestFramework = {
  getAllEvents: () => Promise<ReadonlyArray<DomainEvent>>;
  commands: ToFrameworkCommands<typeof commands>;
};
export const initTestFramework = async (): Promise<TestFramework> => {
  const queryEventsDatabase = initQueryEventsDatabase();
  const frameworkCommitEvent = commitEvent(queryEventsDatabase);
  await ensureEventTableExists(queryEventsDatabase)();
  const frameworkGetAllEvents = () =>
    pipe(
      getAllEvents(queryEventsDatabase)(),
      TE.getOrElse(shouldNotBeCalled)
    )();

  const frameworkify =
    <T>(command: Command<T>) =>
    async (commandPayload: T) => {
      const events = await frameworkGetAllEvents();
      await pipe(
        command.process({command: commandPayload, events}),
        persistOrNoOp(frameworkCommitEvent)
      )();
    };

  return {
    getAllEvents: frameworkGetAllEvents,
    commands: {
      area: {
        create: frameworkify(commands.area.create),
      },
      memberNumbers: {
        linkNumberToEmail: frameworkify(
          commands.memberNumbers.linkNumberToEmail
        ),
      },
      superUser: {
        declare: frameworkify(commands.superUser.declare),
        revoke: frameworkify(commands.superUser.revoke),
      },
    },
  };
};