import {pipe} from 'fp-ts/lib/function';
import {html} from '../types/html';
import {pageTemplateNoNav} from '../templates';

export const checkYourMailPage = (submittedEmailAddress: string) =>
  pipe(
    html`
      <h1>Check your mail</h1>
      <p>
        If <b>${submittedEmailAddress}</b> is linked to a Makespace number you
        should receive an email with that number.
      </p>
      <p>If nothing happens please reach out to the Makespace Database Team.</p>
    `,
    pageTemplateNoNav('Check your mail')
  );
