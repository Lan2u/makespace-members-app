import {Request, Response} from 'express';
import {Config} from '../../configuration';
import {pipe} from 'fp-ts/lib/function';
import * as TE from 'fp-ts/TaskEither';
import * as E from 'fp-ts/Either';
import {formatValidationErrors} from 'io-ts-reporters';
import * as t from 'io-ts';
import {DomainEvent} from '../../types';
import * as O from 'fp-ts/Option';
import {StatusCodes} from 'http-status-codes';
import {failureWithStatus} from '../../types/failureWithStatus';
import {Dependencies} from '../../dependencies';
import {sequenceS} from 'fp-ts/lib/Apply';
import {Command} from '../../types/command';

const getCommandFrom = <T>(body: unknown, command: Command<T>) =>
  pipe(
    body,
    command.decode,
    E.mapLeft(formatValidationErrors),
    E.mapLeft(
      failureWithStatus('Could not decode command', StatusCodes.BAD_REQUEST)
    ),
    TE.fromEither
  );

const persistOrNoOp =
  (deps: Dependencies) => (toPersist: O.Option<DomainEvent>) =>
    pipe(
      toPersist,
      O.matchW(
        () =>
          TE.right({
            status: StatusCodes.OK,
            message: 'No new events raised',
          }),
        deps.commitEvent
      )
    );

const checkBearerToken = (conf: Config) => (authorization: unknown) =>
  pipe(
    authorization,
    t.string.decode,
    E.mapLeft(
      failureWithStatus(
        'Missing authorization header',
        StatusCodes.UNAUTHORIZED
      )
    ),
    E.filterOrElse(
      authString => authString === `Bearer ${conf.ADMIN_API_BEARER_TOKEN}`,
      () => failureWithStatus('Bad authString', StatusCodes.UNAUTHORIZED)()
    ),
    TE.fromEither
  );

export const commandHandler =
  <T>(deps: Dependencies, conf: Config, command: Command<T>) =>
  async (req: Request, res: Response) => {
    await pipe(
      {
        authorization: checkBearerToken(conf)(req.headers.authorization),
        command: getCommandFrom(req.body, command),
        events: deps.getAllEvents(),
      },
      sequenceS(TE.ApplySeq),
      TE.map(command.process),
      TE.chainW(persistOrNoOp(deps)),
      TE.match(
        ({status, message, payload}) =>
          res.status(status).send({message, payload}),
        ({status, message}) => res.status(status).send({message})
      )
    )();
  };
