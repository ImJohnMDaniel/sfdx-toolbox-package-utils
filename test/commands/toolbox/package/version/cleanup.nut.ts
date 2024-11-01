import { TestSession } from '@salesforce/cli-plugins-testkit';

describe('toolbox package version cleanup', () => {
  let session: TestSession;

  before(async () => {
    session = await TestSession.create({ devhubAuthStrategy: 'NONE' });
  });

  after(async () => {
    await session?.clean();
  });
});
