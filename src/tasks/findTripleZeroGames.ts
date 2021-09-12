import { Game } from '../db/Entities/game';
import { initConnection } from '../db/connection';

const aggregation = [
  {
    $match: {
      analysis: {
        $not: {
          $size: 0
        }
      }
    }
  },
  {
    $project: {
      lichessId: 1,
      dateCompleted: '$lastMoveAt',
      myData: {
        $cond: {
          if: {
            $eq: ['$players.white.user.id', 'quirkles']
          },
          then: '$players.white',
          else: {
            $cond: {
              if: {
                $eq: ['$players.black.user.id', 'quirkles']
              },
              then: '$players.black',
              else: null
            }
          }
        }
      }
    }
  },
  {
    $match: {
      'myData.analysis.inaccuracy': 0,
      'myData.analysis.mistake': 0,
      'myData.analysis.blunder': 0
    }
  }
];

const main = async () => {
  await initConnection();
  const results = await Game.aggregate(aggregation);
  return results.map((result) => ({
    url: `https://lichess.org/${result.lichessId}`,
    ratingAtTime: result.myData.rating,
    averageCentipawnLoss: result.myData.analysis.acpl,
    dateCompleted: new Date(result.dateCompleted)
  }));
};

main()
  .then((results) => {
    console.log(results) //eslint-disable-line
    process.exit();
  })
  .catch((err) => {
    console.log(err) //eslint-disable-line
    process.exit();
  });
