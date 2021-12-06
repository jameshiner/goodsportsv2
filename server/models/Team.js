const mongoose = require('mongoose');

const { Schema } = mongoose;

const leaguesSchema = new Schema({
  teamId: String,
  teamName: String,
  leagueId: Number,
  league: String,
  divisionId: Number,
  division: String,
  wins: String,
  losses: String,
  ties: String,
  points: String,
  goalsFor: String,
  goalsAgainst: String,
  gamesPlayed: String,
});

module.exports = mongoose.model('Leagues', leaguesSchema);
