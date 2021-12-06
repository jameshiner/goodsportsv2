const mongoose = require('mongoose');

const { Schema } = mongoose;

const gamesSchema = new Schema({
  gameId: Number,
  leagueId: Number,
  leagueName: String,
  week: String,
  time: String,
  dateStr: String,
  date: String,
  timestamp: Date,
  team1Id: Number,
  team1Name: String,
  team2Id: Number,
  team2Name: String,
});

module.exports = mongoose.model('Games', gamesSchema);
