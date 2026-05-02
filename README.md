# 🏏 CricBuds

A weekly cricket prediction game for friend groups. Predict your mates' performance, enter actual stats, and reveal the winner with a dramatic animated countdown.

## Features

- **Weekly contests** — Admin opens a contest with a prediction deadline
- **Hidden predictions** — Place bets on anyone's runs, wickets, catches & missed catches; no one sees yours until reveal
- **Stats entry** — Each player enters their own match performance
- **Dramatic reveal** — Animated ranking reveal with confetti for the winner
- **Season leaderboard** — Cumulative points across all contests
- **Google Sign-in** — Admin controls who can join via email allowlist

## Stack

- **Next.js 16** (App Router) + TypeScript
- **NextAuth.js v5** — Google OAuth
- **Neon Postgres** (via `@neondatabase/serverless`) + **Drizzle ORM**
- **Tailwind CSS 4** + **shadcn/ui** components
- **framer-motion** + **canvas-confetti** for the reveal animation

## Setup

### 1. Clone and install

```bash
git clone https://github.com/YOUR_USERNAME/cricbuds.git
cd cricbuds
npm install
```

### 2. Google OAuth credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project → **APIs & Services** → **Credentials** → **OAuth 2.0 Client ID**
3. Add authorized redirect URI: `https://your-domain.vercel.app/api/auth/callback/google`
   - For local dev also add: `http://localhost:3000/api/auth/callback/google`
4. Copy the **Client ID** and **Client Secret**

### 3. Vercel + Neon Postgres

1. Push this repo to GitHub
2. Import in [Vercel](https://vercel.com) → add a **Neon Postgres** store from the Storage tab
3. Set environment variables in Vercel:

```
AUTH_GOOGLE_ID=<from Google Console>
AUTH_GOOGLE_SECRET=<from Google Console>
AUTH_SECRET=<random 32-char string — run: node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))">
```

4. Pull env vars locally:

```bash
vercel link
vercel env pull .env.local
```

### 4. Database setup

```bash
# Push schema to Neon
npm run db:push

# Create your admin account (replace with your Google email)
npm run db:seed -- your@email.com
```

### 5. Run locally

```bash
npm run dev
```

Visit `http://localhost:3000` and sign in with your admin Google account.

## How It Works

### Contest states

```
OPEN → LOCKED → REVEALED
```

| State | What happens |
|-------|-------------|
| **OPEN** | Players place predictions (hidden from others). Auto-locks at deadline. |
| **LOCKED** | Prediction window closed. Players enter their actual match stats. |
| **REVEALED** | Admin triggers reveal. Scores computed, animated results shown. |

### Scoring

Winner = lowest sum of `|predicted - actual|` across all 4 stats (runs, wickets, catches, missed) for all players you predicted.

**Leaderboard points per contest:** 1st=10, 2nd=7, 3rd=5, 4th=3, 5th=2, 6th+=1

### Admin workflow

1. Go to **Admin** → **New Contest** → set week name + prediction deadline
2. Add friends' emails in **Admin → Players** — only those emails can sign in
3. After the deadline, contest auto-locks; go to the contest → **Reveal Winner**

## Project Structure

```
src/
  app/
    (app)/          # Authenticated pages
      dashboard/    # Home with active contest
      contest/[id]/ # Contest detail, predict, stats, reveal
      leaderboard/  # Season standings
      admin/        # Create contests, manage players
    api/            # REST API routes
  lib/
    auth.ts         # NextAuth config
    db/             # Drizzle schema + client
    scoring.ts      # Winner calculation algorithm
  components/       # UI components
scripts/
  seed-admin.ts     # Bootstrap first admin user
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | Neon Postgres connection string (auto-set by Vercel integration) |
| `AUTH_GOOGLE_ID` | Yes | Google OAuth Client ID |
| `AUTH_GOOGLE_SECRET` | Yes | Google OAuth Client Secret |
| `AUTH_SECRET` | Yes | Random secret for NextAuth session encryption |

## Deploy

Push to `main` — Vercel auto-deploys on every commit.
