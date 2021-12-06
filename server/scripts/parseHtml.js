import fetch from 'node-fetch';
import { parse as parseHTML } from 'node-html-parser';
import mongoose from 'mongoose';

import fs from 'fs';

import { mongoURI } from '../config/keys';

import Games from '../models/Game';
import Teams from '../models/Team';
import Leagues from '../models/League';

const data = { leagues: [], teams: [], games: [] };
let teamNames = {};
const leagueMap = {};

const getSchedules = async (leagues, dev) => {
  const baseURL = 'https://www.goodsportsusa.com/';
  const requests = [];
  let toText = [];
  let html;

  if (dev) {
    html = fs.readFileSync(`./${leagues[i].leagueURL}.html`, {
      encoding: 'utf8',
    });
    return parseHTML(html);
  }
  for (let i = 0; i < leagues.length; i += 1) {
    requests.push(
      fetch(
        `${baseURL}standings-schedules/${leagues[i].sport}/${leagues[i].leagueURL}_files/sheet001.htm`,
      ),
    );
  }
  // const body = await response.text();
  // return parseHTML(body);
  toText = (await Promise.all(requests)).map((r) => r.text());
  return (await Promise.all(toText)).map((r, i) => ({ html: parseHTML(r), ...leagues[i] }));
  // for (let j = 0; j < reqs.length; j += 1) {
  // console.log(reqs[j].text());
  // }
};

const getTeams = (teams) =>
  teams
    .replace(/[^a-zA-Z0-9.]/g, '')
    .split('v')
    .map((r) => parseInt(r, 10));

const buildTimeStamp = (date, time) => new Date(`${date}-${new Date().getFullYear()} ${time}`);

const processGame = (leagueId, teamsStr, weekInfo, time, gameId, week) => {
  const [team1Id, team2Id] = getTeams(teamsStr);
  // const team1 = data.teams[team1Id];
  // const team2 = data.teams[team2Id];
  // console.log(teamsStr);

  const timestamp = buildTimeStamp(weekInfo[`date${week}`], time);
  // team1.games.push(gameId);
  // team2.games.push(gameId);
  data.games.push({
    gameId,
    leagueId,
    leagueName: leagueMap[leagueId],
    team1Id,
    team1Name: teamNames[team1Id],
    team2Id,
    team2Name: teamNames[team2Id],
    time,
    date: weekInfo[`date${week}`],
    week: weekInfo[`week${week}`],
    timestamp,
    dateStr: timestamp.toLocaleString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    }),
  });
};

const buildData = (schedules) => {
  const divisions = ['A', 'B', 'C', 'D', 'E'];
  const timeRegex = /[0-9]{1,2}:[0-9]{1,2} (A|P)M/gi;

  for (let i = 0; i < schedules.length; i += 1) {
    const schedule = schedules[i];
    const { html, ...league } = schedule;
    const { leagueName } = league;
    const table = html.getElementsByTagName('table')[0];
    const trs = table.getElementsByTagName('tr');
    let processingTeam = false;
    let divisionId = -1;
    let gameId = 1;
    let sectionDateInfo;

    league.id = i;
    leagueMap[i] = leagueName;
    data.leagues.push(league);
    teamNames = {};

    for (let j = 2; j < trs.length; j += 1) {
      const tds = trs[j].childNodes.filter((r) => r.tagName === 'TD').map((r) => r.innerText || '');
      const tds0 = tds[0].toLowerCase();
      const tds2 = tds[2];

      if (tds[6] && tds[6].toLowerCase().indexOf('playoff') > -1) {
        break;
      }

      processingTeam = (tds2 && !!tds2.match(/([0-9]+ [\w\s.]+)/gi)) || tds0 === 'pl';
      if (processingTeam) {
        // 0 - place
        // 1 - color
        if (tds0 === 'pl' || tds0 === 'place') {
          divisionId += 1;
        } else if (tds0.includes('seeding')) {
          continue;
        } else {
          let [id, ...teamName] = tds2.split(' '); // 2 - id teamName
          teamName = teamName.join(' ').replace('\n', '').replace('\r', '');
          teamNames[id] = teamName; // add to team name map
          data.teams.push({
            teamId: id,
            teamName,
            leagueId: i,
            league: leagueName,
            divisionId,
            division: divisions[divisionId],
            wins: tds[3], // 3 - wins
            losses: tds[4], // 4 - losses
            ties: tds[5], // 5 - ties
            points: tds[6], // 6 - points
            goalsFor: tds[7], // 7 - goals for
            goalsAgainst: tds[8], // 8 - goals against
            gamesPlayed: tds[9], // 9 - games played
          });
        }
      } else {
        const time1 = tds[0];
        const time2 = tds[5];
        const time3 = tds[9];
        const isTime1 = time1 && time1.match(timeRegex);
        const isTime2 = time2 && time2.match(timeRegex);
        const isTime3 = time3 && time3.match(timeRegex);
        // new week
        if (tds[0].toLowerCase().includes('week')) {
          sectionDateInfo = {
            week1: parseInt(tds[2], 10),
            date1: tds[4],
            week2: parseInt(tds[6], 10),
            date2: tds[8],
            week3: parseInt(tds[10], 10),
            date3: tds[12],
          };
        } else if (isTime1 || isTime2 || isTime3) {
          // week 1
          if (tds[3] && tds[3] !== '&nbsp;') {
            processGame(i, tds[3], sectionDateInfo, time1, gameId++, 1);
          }
          // week 2
          if (tds[7] && tds[7] !== '&nbsp;') {
            processGame(i, tds[7], sectionDateInfo, time2, gameId++, 2);
          }
          // week 3
          if (tds[11] && tds[11] !== '&nbsp;') {
            processGame(i, tds[11], sectionDateInfo, time3, gameId++, 3);
          }
        }
      }
    }
  }
  // console.log(data.teams['28'].games);
  // console.log(data.games[data.teams['28'].games[0]]);
  // let x = data.games[data.teams['28'].games[0]];
  // console.log(`${x.date}-${new Date().getFullYear()} ${x.time}`);
  // console.log(
  //   new Date(`${x.date}-${new Date().getFullYear()} ${x.time}`).toLocaleString(
  //     'en-US',
  //     { weekday: 'long', month: 'long', day: 'numeric' }
  //   )
  // );
  // console.log(data.games);
};

(async () => {
  // for (let i = 0; i < leagues.length; i+=1) {
  const leagues = [
    {
      leagueURL: 'mensopensoccerfall2021',
      leagueName: "Men's Open 7v7 - Fall 2021",
      sport: 'Soccer',
    },
    {
      leagueURL: 'coedsoccerfall2021',
      leagueName: 'Co-Ed Soccer - Fall 2021',
      sport: 'Soccer',
    },
  ];
  const schedules = await getSchedules(leagues, false);

  // console.log(schedules);
  buildData(schedules);

  // mongoose;
})();
