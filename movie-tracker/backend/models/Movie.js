const mongoose = require('mongoose');

const MovieSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  movie_id: { type: Number, required: true },
  media_type: { type: String, enum: ['movie', 'tv'], default: 'movie' },
  title: { type: String, required: true },
  original_language: { type: String, default: null }, // e.g. 'en', 'ja', 'ko'
  poster_url: String,
  genres: [String],
  release_year: String,
  status: { type: String, enum: ['watchlist', 'watched'], default: 'watchlist' },
  rating: { type: Number, min: 0, max: 10, default: null },
  remarks: { type: String, default: '' },
  rewatch_value: { type: String, enum: ['Yes', 'Maybe', 'No', null], default: null },
  date_added: { type: Date, default: Date.now },
  date_watched: { type: Date, default: null },
  rank: { type: Number, default: null },
  trailer_key: { type: String, default: null },
  overview: { type: String, default: '' },
  tmdb_rating: { type: Number, default: null },
  cached_at: { type: Date, default: Date.now },
  // TV show season ratings
  season_ratings: [{
    season: { type: Number, required: true },
    rating: { type: Number, min: 0, max: 10, default: null },
    remarks: { type: String, default: '' }
  }],
  total_seasons: { type: Number, default: null },
  watch_status: { type: String, enum: ['ongoing', 'completed', 'dropped', null], default: null }
});

MovieSchema.index({ userId: 1, status: 1 });
MovieSchema.index({ userId: 1, movie_id: 1 }, { unique: true });

module.exports = mongoose.model('Movie', MovieSchema);
