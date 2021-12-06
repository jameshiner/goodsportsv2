const Games = require('./models/Game');
const Teams = require('./models/Team');
const Leagues = require('./models/League');

const getLeagues = async () => {
  try {
    const leagues = await Leagues.find().sort('leagueName');
    return { err: null, leagues };
  } catch (err) {
    return { err, leagues: null };
  }
};

const getTeams = async () => {
  try {
    const teams = await Teams.find().sort('teamName');
    return { err: null, teams };
  } catch (err) {
    return { err, teams: null };
  }
};

module.exports = (app) => {
  app.get('/', async (req, res) => {
    const { err, teams } = await getTeams();
    if (err) {
      res.send(err);
    }
    const { err: leagueErr, leagues } = await getLeagues();
    if (leagueErr) {
      res.send(leagueErr);
    }

    res.render('index', { teams, leagues });
  });

  app.get('/api/games/', async (req, res) => {
    const { team, games, league } = req.query;

    const query = Games.find()
      .or([{ homeID: team }, { awayID: team }])
      .and({ leagueID: league });

    if (games === 'u') {
      query.where('date').gte(new Date());
    } else if (games === 'n') {
      query.where('date').gte(new Date()).limit(1);
    }
    query.sort('date');
    query.exec(async (queryErr, gameList) => {
      const { err, teams } = await getTeams();
      const { err: leagueErr, leagues } = await getLeagues();
      if (queryErr || err || leagueErr) {
        res.render('index', { teams, msg: 'Error. Please try again.' });
      }

      res.render('index', {
        team: parseInt(team, 10),
        teams,
        gameList,
        leagues,
        league: parseInt(league, 10),
        games,
      });
    });
  });
};
