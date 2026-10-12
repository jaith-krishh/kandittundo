# kandittundo? — Personal Movie & TV Tracker

Track, rate and rank the movies and shows you watch. Sign in with Google, search TMDB,
keep a watchlist, rate seasons of TV shows, import a Letterboxd/IMDb CSV and share a public profile.

## Setup

### 1. Get API credentials
- **TMDB:** sign up at https://www.themoviedb.org/settings/api and grab an API key.
- **Google OAuth:** create an OAuth client (type "Web application") in the Google Cloud console and add
  `http://localhost:5000/api/auth/google/callback` as an authorized redirect URI.
- **MongoDB:** a local MongoDB or a MongoDB Atlas connection string.

### 2. Backend
```bash
cd backend
npm install
cp .env.example .env
# Fill in the values (see below)
npm run dev
```

### 3. Frontend
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Open http://localhost:3000

## Environment Variables

**backend/.env** (the server refuses to start if a required one is missing)
```
MONGO_URI=mongodb://localhost:27017/movietracker   # required
TMDB_API_KEY=your_key_here                         # required
GOOGLE_CLIENT_ID=your_google_client_id             # required
GOOGLE_CLIENT_SECRET=your_google_client_secret     # required
SESSION_SECRET=long_random_string                  # required
BACKEND_URL=http://localhost:5000                  # used to build the OAuth callback URL
FRONTEND_URL=http://localhost:3000                 # where to send users after login; CORS origin
PORT=5000
```

**frontend/.env**
```
VITE_API_URL=http://localhost:5000/api
```
Leave `VITE_API_URL` unset when the backend serves the built frontend (it then uses `/api`).

## Deployment
The backend serves the built frontend from `frontend/dist`, so the simplest setup is one service
(e.g. Render): build the frontend, start the backend, and set `BACKEND_URL` and `FRONTEND_URL`
to the same public URL. The session cookie uses `SameSite=Lax`, so hosting the frontend and backend
on different sites (e.g. `vercel.app` + `onrender.com`) will break login.

On startup the backend runs one-off data migrations (recorded in the `migrations` collection) and
syncs MongoDB indexes for the `movies` collection.
