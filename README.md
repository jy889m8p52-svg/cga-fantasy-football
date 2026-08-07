# Crippling Gambling Addicts Fantasy Football

Production-ready static league website with a Vercel serverless ESPN Fantasy endpoint.

## Upload to GitHub
Upload the CONTENTS of this folder to the root of `cga-fantasy-football`.

## Deploy to Vercel
1. In Vercel, Add New → Project.
2. Import `jy889m8p52-svg/cga-fantasy-football`.
3. Leave Framework Preset as Other (Vercel will serve the static site and `/api/espn.js` function).
4. Add these Environment Variables in Project Settings:
   - `ESPN_SWID`
   - `ESPN_S2`
   - `ESPN_LEAGUE_ID` = `1998048449`
   - `ESPN_SEASON` = `2026`
5. Deploy/redeploy.

## Security
Never commit `ESPN_SWID` or `ESPN_S2` into GitHub. They are private session credentials.

## Current sections
Home, Standings, Schedule, Managers, Hall of Fame, Records, Rules, History, and the Palmer McCarthey memorial.
