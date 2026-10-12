const mongoose = require('mongoose');
const Movie = require('../models/Movie');
const User = require('../models/User');
const { normalizeGenreNames, LEGACY_GENRE_NAMES } = require('./genreCache');

// xss-clean used to store "<" as "&lt;"
const unescapeLt = (s) => typeof s === 'string' ? s.replace(/&lt;/g, '<') : s;

// One-off data fixes. Each runs once per database; finished ones are recorded in the "migrations" collection.
const MIGRATIONS = [
  {
    name: '2026-10-default-media-type',
    // media_type is now part of the unique key, so older entries without it need a value
    run: () => Movie.updateMany(
      { $or: [{ media_type: { $exists: false } }, { media_type: null }] },
      { $set: { media_type: 'movie' } }
    )
  },
  {
    name: '2026-10-normalize-genres',
    run: async () => {
      const docs = await Movie.find({ genres: { $in: LEGACY_GENRE_NAMES } }, 'genres').lean();
      if (!docs.length) return;
      await Movie.bulkWrite(docs.map(d => ({
        updateOne: { filter: { _id: d._id }, update: { $set: { genres: normalizeGenreNames(d.genres) } } }
      })));
    }
  },
  {
    name: '2026-10-undo-xss-clean-escaping',
    run: async () => {
      const movies = await Movie.find({
        $or: [{ title: /&lt;/ }, { remarks: /&lt;/ }, { overview: /&lt;/ }, { 'season_ratings.remarks': /&lt;/ }]
      }, 'title remarks overview season_ratings').lean();
      if (movies.length) {
        await Movie.bulkWrite(movies.map(m => {
          const set = {};
          for (const f of ['title', 'remarks', 'overview']) if (typeof m[f] === 'string') set[f] = unescapeLt(m[f]);
          if (m.season_ratings) set.season_ratings = m.season_ratings.map(s => ({ ...s, remarks: unescapeLt(s.remarks) }));
          return { updateOne: { filter: { _id: m._id }, update: { $set: set } } };
        }));
      }
      const users = await User.find({ displayName: /&lt;/ }, 'displayName').lean();
      if (users.length) {
        await User.bulkWrite(users.map(u => ({
          updateOne: { filter: { _id: u._id }, update: { $set: { displayName: unescapeLt(u.displayName) } } }
        })));
      }
    }
  }
];

async function runMigrations() {
  const done = mongoose.connection.db.collection('migrations');
  for (const m of MIGRATIONS) {
    if (await done.findOne({ _id: m.name })) continue;
    await m.run();
    await done.insertOne({ _id: m.name, ranAt: new Date() });
    console.log('Migration done:', m.name);
  }
  // Drops the old { userId, movie_id } unique index and builds the new one that includes media_type
  await Movie.syncIndexes();
}

module.exports = { runMigrations };
