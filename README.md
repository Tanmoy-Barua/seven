# SEVEN

A daily habit manager for the seven things that actually work — with **login**, a **SQLite database**, **mobile layout**, and **installable PWA** support for phones.

## Features

- Create an account / log in
- Track the **7 daily habits**
- Follow a **day schedule** checklist
- Run a **2-hour deep work timer**
- Log your **one small hard thing**
- Build **identity + trigger** cues
- See **everyday progress history** from the database
- **Mobile responsive** layout
- **Install as an app** on Android / iPhone (Add to Home Screen)

Progress is saved to SQLite on the server when you are logged in. A local cache keeps the UI fast.

## Run

```bash
npm install
npm run dev
```

- App: http://localhost:5173  
- API: http://localhost:3001  

## Install on your phone

1. Open the site in Chrome (Android) or Safari (iPhone)
2. Use **Install** when prompted, or:
   - **Android Chrome:** menu → Install app / Add to Home screen
   - **iPhone Safari:** Share → Add to Home Screen

## Production

```bash
npm run build
npm start
```

Serves the built app and API from port `3001`.

## Data

SQLite file lives at `data/seven.db` (gitignored).
