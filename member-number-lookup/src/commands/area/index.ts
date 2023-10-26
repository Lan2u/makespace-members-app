import {Request, Response} from 'express';
import {pipe} from 'fp-ts/lib/function';
import * as TE from 'fp-ts/TaskEither';
import {Dependencies} from '../../dependencies';
import {render} from './render';
import {getUserFromSession} from '../../authentication';
import {logInRoute} from '../../authentication/configure-auth-routes';
import {failureWithStatus} from '../../types/failureWithStatus';
import {StatusCodes} from 'http-status-codes';

export const createAreaForm =
  (deps: Dependencies) => async (req: Request, res: Response) => {
    await pipe(
      req.session,
      getUserFromSession(deps),
      TE.fromOption(() =>
        failureWithStatus('You are not logged in.', StatusCodes.UNAUTHORIZED)()
      ),
      TE.map(user => ({user})),
      TE.map(render),
      TE.matchW(
        () => res.redirect(logInRoute),
        page => res.status(200).send(page)
      )
    )();
  };
