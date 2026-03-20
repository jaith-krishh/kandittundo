# CineTrack — Personal Movie Tracker

## Setup

### 1. Get a TMDB API Key
Sign up at https://www.themoviedb.org/settings/api and grab your API key.

### 2. Backend
```bash
cd backend
npm install
cp .env.example .env
# Fill in MONGO_URI and TMDB_API_KEY in .env
npm run dev
```

### 3. Frontend
```bash
cd frontend
npm install
cp .env.example .env
# Set VITE_API_URL=http://localhost:5000/api
npm run dev
```

Open http://localhost:3000

## Environment Variables

**backend/.env**
```
MONGO_URI=mongodb://localhost:27017/movietracker
TMDB_API_KEY=your_key_here
PORT=5000
```

**frontend/.env**
```
VITE_API_URL=http://localhost:5000/api
```

## Deployment
- Frontend → Vercel (set `VITE_API_URL` to your backend URL)
- Backend → Render (set env vars in dashboard)
- Database → MongoDB Atlas (use Atlas connection string for `MONGO_URI`)
