const mongoose = require('mongoose');

const { Schema } = mongoose;

const leaguesSchema = new Schema({
  leagueURL: String,
  leagueName: String,
  sport: String,
  leagueID: Number,
});

module.exports = mongoose.model('Leagues', leaguesSchema);
