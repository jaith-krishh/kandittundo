// TMDB ids are only unique per media type (movie 1399 and TV show 1399 are different titles),
// so always identify a title by both
export const mediaKey = (m) => `${m.media_type || 'movie'}:${m.movie_id}`;
export const sameTitle = (a, b) => mediaKey(a) === mediaKey(b);
