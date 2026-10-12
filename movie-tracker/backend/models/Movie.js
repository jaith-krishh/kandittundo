const mongoose = require('mongoose');

const MovieSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  movie_id: { type: Number, required: true },
  media_type: { type: String, enum: ['movie', 'tv'], default: 'movie' },
  title: { type: String, required: true, maxlength: 300 },
  original_language: { type: String, default: null, maxlength: 10 }, // e.g. 'en', 'ja', 'ko'
  poster_url: { type: String, match: /^https:\/\/image\.tmdb\.org\// },
  genres: [{ type: String, maxlength: 50 }],
  release_year: { type: String, maxlength: 10 },
  status: { type: String, enum: ['watchlist', 'watched'], default: 'watchlist' },
  rating: { type: Number, min: 0, max: 10, default: null },
  remarks: { type: String, default: '', maxlength: 2000 },
  rewatch_value: { type: String, enum: ['Yes', 'Maybe', 'No', null], default: null },
  date_added: { type: Date, default: Date.now },
  date_watched: { type: Date, default: null },
  rank: { type: Number, default: null },
  trailer_key: { type: String, default: null },
  overview: { type: String, default: '', maxlength: 5000 },
  tmdb_rating: { type: Number, default: null },
  cached_at: { type: Date, default: Date.now },
  // TV show season ratings
  season_ratings: [{
    season: { type: Number, required: true, min: 0, max: 500 },
    rating: { type: Number, min: 0, max: 10, default: null },
    remarks: { type: String, default: '', maxlength: 1000 }
  }],
  total_seasons: { type: Number, default: null, min: 0, max: 500 },
  watch_status: { type: String, enum: ['ongoing', 'completed', 'dropped', null], default: null }
});

MovieSchema.index({ userId: 1, status: 1 });
// TMDB numbers movies and TV shows separately, so the same movie_id can be one of each
MovieSchema.index({ userId: 1, media_type: 1, movie_id: 1 }, { unique: true });

module.exports = mongoose.model('Movie', MovieSchema);
