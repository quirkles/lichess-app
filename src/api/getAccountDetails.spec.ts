import { getAccountDetails } from './getAccountDetails';

describe('getAccountDetails', () => {
  it('works', async () => {
    const result = await getAccountDetails();
    expect(result.username).toBe('quirkles');
  });
});
