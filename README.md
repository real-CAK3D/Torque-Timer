# TorqueClock Mechanic Time

Phone-first mechanic shift/job timer served on Tailscale port `8800`.

## Live runtime

- App path: `/home/ubuntu/mechanic-clock`
- Service: `torqueclock.service`
- Local URL: `http://127.0.0.1:8800/`
- Tailnet URL: `http://100.82.165.23:8800/`
- Runtime data: `data.json` (ignored by git)

Run manually:

```bash
MECH_CLOCK_PORT=8800 python3 app.py
```

Restart service:

```bash
systemctl --user restart torqueclock.service
```

## Workflow

TorqueClock is built for one-finger shop use:

1. Clock in.
2. Select vehicle.
3. Select W/O package and optional line items.
4. Review.
5. Work each W/O timer card.
6. Park/resume vehicles, wait for parts/approval, break/lunch, finish, and review stats.

Current deliberate exclusions: checklist templates and browser offline-storage queue are deferred.

## Accounts & per-user data

TorqueClock is multi-user: everyone logs in with a username/password, and each person's shifts, jobs, schedule, and stats are kept separate.

- **First run**: the login screen has a "Create account" link. The **first** account ever registered on a fresh install becomes admin automatically — everyone after that registers as a regular tech.
- **Existing installs being upgraded to this version**: your prior single-user history is automatically migrated under the username `CAK3D` the first time the server starts. Register with that exact username (same case) to attach your login to that existing history — it will not be overwritten.
- Passwords are hashed (PBKDF2-SHA256, salted, 120k iterations) and stored only in the git-ignored `data.json` — never in source code, never pushed to GitHub.
- Sessions are a random bearer token sent as `X-Session-Token`; they don't expire, so a shop tablet/phone stays logged in until someone explicitly logs out (Settings → Log out).
- Change your password any time from Settings.
- `presets` (job/downtime lists, flat-rate book hours) are shared shop-wide; everything else (`days`, `schedule`, `activeShift`, labor rate, efficiency goal) is scoped per user.

## Flat-rate efficiency tracking

TorqueClock tracks book (flat-rate) hours against actual clock hours so you can see how you're really doing, not just how long things took:

- **Book time editor** — Settings → Flat-rate (book) hours. Set the sold hours per operation; built-in defaults cover common jobs out of the box. Rates are stored server-side in `data.json` (`presets.book`), not the browser, so they travel with the shop and land in archives.
- **Efficiency badges** — every operation, and each Live Tally period (today/7 day/31 day), shows billed ÷ actual as a color badge: green ≥100%, amber 85–99%, red <85%, gray when no book time is set yet.
- **Efficiency by day of week / by time of day** — Stats page cards showing which weekdays and shop-hour windows run efficient vs. where time bleeds away.
- **Efficiency this range** — a quick billed-hours-vs-actual-hours summary at the top of Stats for whatever range you've selected, plus $ billed if a labor rate is set.
- **Labor rate & dollars** — set $/hr in Settings → Account; Stats then shows $ billed and $ per clock hour alongside efficiency %, and CSV export gets a `dollarsBilled` column.
- **Efficiency goal** — set a target % in Settings → Account; Stats shows a progress bar against it for the selected range.
- **Comeback tracking** — mark any completed job as a comeback from History (with an optional reason); Stats shows comeback rate and which jobs come back most.
- CSV export (Stats → Export CSV) includes weekday, time-of-day bucket, book hours, efficiency %, and dollars billed per line item.

## GitHub-style monthly archives

Use **Settings → Save GitHub-style month archive** or **Stats → Save month archive**. An archive is also saved automatically every time you clock out, so a GitHub-committable record exists even if nobody remembers to click the button.

That creates, per user:

```text
archive/YYYY-MM/<username>/torqueclock-YYYY-MM-DDTHH-MM-SSZ.json
archive/YYYY-MM/<username>/monthly-summary.json
```

`data.json` stays local/ignored, while the organized `archive/YYYY-MM/<username>/` snapshots can be committed to GitHub when you want that record saved. Each snapshot only ever contains that one user's own data — never other users' data or any password.

## Data resilience

- Every save keeps a rolling `data.prev.json` (previous state) and a once-per-day timestamped copy under `backups/` (both git-ignored, kept 14 days) — cheap insurance against a bad write or an accidental mass-delete, on top of the existing corrupt-file recovery that already renames and rebuilds a broken `data.json`.
- Restore by stopping the service and copying the desired `backups/data-YYYY-MM-DD.json` (or `data.prev.json`) over `data.json`.

Rollback/stop: `systemctl --user stop torqueclock.service` or restore from a backup/archive snapshot before replacing `data.json`.
