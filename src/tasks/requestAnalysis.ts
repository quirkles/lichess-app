import puppeteer, { Browser, Page } from 'puppeteer';
import { loadEnv } from '../services/env';
import { getSingleGameDetails } from '../api/getSingleGame';
import { initConnection } from '../db/connection';
import { Game } from '../db/Entities/game';

loadEnv();

const findGamesToRequestAnalysis = async () => {
  const aggregation = [
    {
      $match: {
        $expr: {
          $gt: [
            {
              $strLenCP: '$moves'
            },
            40
          ]
        }
      }
    },
    {
      $project: {
        lichessId: 1,
        createdAt: 1,
        hasAnalysis: {
          $cond: {
            if: {
              $eq: [
                {
                  $size: '$analysis'
                },
                0
              ]
            },
            then: 0,
            else: 1
          }
        }
      }
    },
    {
      $sort: {
        createdAt: 1
      }
    }
  ];
  await initConnection();
  const games = await Game.aggregate(aggregation);
  let gamesSinceLastAnalysis = 0;
  const results: { [n: number]: number[] } = {};
  games.reduce((newResults, result, i) => {
    if (result.hasAnalysis) {
      result.gamesSinceLastAnalysis = gamesSinceLastAnalysis;
      if (!results[gamesSinceLastAnalysis]) {
        results[gamesSinceLastAnalysis] = [i];
      } else {
        results[gamesSinceLastAnalysis].push(i);
      }
      gamesSinceLastAnalysis = 0;
    } else {
      gamesSinceLastAnalysis += 1;
    }
    newResults.push(result);
    return newResults;
  }, []);
  const gamesToAnalyze: { lichessId: string }[] = [];
  let gaps = Object.keys(results)
    .sort((a, b) => Number(b) - Number(a))
    .map(Number);
  while (gamesToAnalyze.length < 20) {
    const [gap, ...rest] = gaps;
    for (const index of results[gap as number]) {
            gamesToAnalyze.push(games[index - Math.floor(gap / 2)]) //eslint-disable-line
    }
    gaps = rest;
  }
  return gamesToAnalyze.map((g) => g.lichessId);
};

const createBrowser = (): Promise<Browser> => {
  return puppeteer.launch({
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-features=site-per-process',
      '--disable-background-networking',
      '--disable-default-apps',
      '--disable-extensions',
      '--disable-gpu',
      '--disable-sync',
      '--disable-translate',
      '--metrics-recording-only',
      '--mute-audio',
      '--no-first-run',
      '--safebrowsing-disable-auto-update'
    ],
    slowMo: 10,
    headless: false,
    defaultViewport: {
      width: 800,
      height: 800
    }
  });
};

const login = async (
  page: Page,
  authenticationParams: { username: string; password: string }
): Promise<Page> => {
  await page.goto(`https://lichess.org/login?referrer=/`);
  await page.type('input[name="username"]', authenticationParams.username);
  await page.type('input[name="password"]', authenticationParams.password);
  await page.click('button.submit');
  await page.waitForNavigation();
  return page;
};

const delay = (ms: number): Promise<void> =>
  new Promise((res) => setTimeout(res, ms));

const requestAnalysis = async (
  page: Page,
  lichessId: string
): Promise<void> => {
  await page.goto(`https://lichess.org/${lichessId}`);

  ///try to go to analysis page
  try {
    await page.click('a.fbt.analysis');
  } catch (err) {
    console.log('no analysis button found, may be analysis page already') //eslint-disable-line
  }

  ///go to analysis tab
  await page.waitForSelector('span.computer-analysis');
  await page.click('span.computer-analysis');

  // try to click on request analysis button
  try {
    console.log('Requesting analysis') //eslint-disable-line
    await delay(500); // dont like this but the ui makes it hard to verify when the analysis is actually done to wait 30 seconds
    await page.waitForSelector('form.future-game-analysis button', {
      timeout: 500
    });
    await page.click('form.future-game-analysis button');
    console.log('waiting for analysis') //eslint-disable-line
    await delay(30 * 1000); // dont like this but the ui makes it hard to verify when the analysis is actually done to wait 30 seconds
  } catch (e) {
    console.log('no request analysis button found, may be available already') //eslint-disable-line
  }

  // verify analysis is there
  try {
    await page.waitForSelector(
      '.analyse__acpl .advice-summary > a.button.text',
      { timeout: 500 }
    );
    await page.waitForFunction(
      'document.querySelector(".analyse__acpl .advice-summary > a.button.text").innerText.toLowerCase() === "learn from your mistakes"'
    );
    console.log('done') //eslint-disable-line
  } catch (e) {
    console.log("failed to request analysis") //eslint-disable-line
  }
};

const main = async (): Promise<string[]> => {
  const lichessIds = await findGamesToRequestAnalysis();
  const browser = await createBrowser();
  const page = await browser.newPage();
  const authenticationParams = {
    username: process.env.LICHESS_USERNAME as string,
    password: process.env.LICHESS_PASSWORD as string
  };

  const gamesAnalysed = [];
  await login(page, authenticationParams);
  for (const lichessId of lichessIds) {
    try {
      await requestAnalysis(page, lichessId);
      const gameDetails = await getSingleGameDetails(lichessId);
      const doc = await Game.findOneAndUpdate(
        { lichessId },
        { players: gameDetails.players, analysis: gameDetails.analysis },
        { new: true }
      );
      console.log('new game', doc?.toJSON()) //eslint-disable-line
      gamesAnalysed.push(lichessId);
    } catch (err) {
        console.log('failed to request analysis for game', lichessId) //eslint-disable-line
    }
  }
  await browser.close();
  return gamesAnalysed;
};

main()
  .then((games) => {
        console.log('Successfully requested analysis for games', games) //eslint-disable-line
    process.exit();
  })
  .catch((err) => {
        console.log(err) //eslint-disable-line
    process.exit();
  });
