import {head} from './head';
import {html} from './html';

export const pageTemplateNoNav = (title: string) => (body: string) =>
  html`
    <!DOCTYPE html>
    <html lang="en">
      ${head(title)}
      <body>
        ${body}
      </body>
    </html>
  `;
