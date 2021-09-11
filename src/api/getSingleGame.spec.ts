import {getAccountDetails} from "./getAccountDetails";
import {getSingleGameDetails} from "./getSingleGame";

describe('getSingleGame', () => {
    it('works', async () => {
        const result = await getSingleGameDetails('BW3Ok8ls')
        expect(result).toEqual({})
    });
});
