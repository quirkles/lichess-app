import puppeteer from 'puppeteer';
import { loadEnv } from '../services/env';

loadEnv();

const main = async (lichessId: string) => {
  const browser = await puppeteer.launch({
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
  const page = await browser.newPage();
  // login
  await page.goto(`https://lichess.org/login?referrer=/`);
  await page.type(
    'input[name="username"]',
    process.env.LICHESS_USERNAME as string
  );
  await page.type(
    'input[name="password"]',
    process.env.LICHESS_PASSWORD as string
  );
  await page.click('button.submit');
  await page.waitForNavigation();
  // go to game
  await page.goto(`https://lichess.org/${lichessId}`);
  await page.click('a.fbt.analysis');

  await page.waitForSelector('span.computer-analysis');
  await page.click('span.computer-analysis');
  await page.click('form.future-game-analysis button');
  await page.waitForSelector('.analyse__acpl');

  await browser.close();
};

const lichessId = 'inlqIna3';

main(lichessId)
  .then(() => {
        console.log('Successful requested analysis for game', lichessId) //eslint-disable-line
    // process.exit();
  })
  .catch((err) => {
        console.log(err) //eslint-disable-line
    // process.exit();
  });
