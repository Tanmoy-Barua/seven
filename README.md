# SEVEN

A daily habit manager for the seven things that actually work — with **login** and a **SQLite database** so you can track everyday progress.

## Features

- Create an account / log in
- Track the **7 daily habits**
- Follow a **day schedule** checklist
- Run a **2-hour deep work timer**
- Log your **one small hard thing**
- Build **identity + trigger** cues
- See **everyday progress history** from the database
- Milestones for 2 weeks / 3 months / 1 year

Progress is saved to SQLite on the server when you are logged in. A local cache keeps the UI fast.

## Run

```bash
npm install
npm run dev
```

- App: http://localhost:5173  
- API: http://localhost:3001  

This starts both the Vite frontend and the Express + SQLite API.

## Production

```bash
npm run build
npm start
```

Serves the built app and API from port `3001`.

## Data

SQLite file lives at `data/seven.db` (gitignored).
