# TorqueClock Mechanic Time

Phone-first mechanic shift/job timer served on Tailscale port `8799`.

## Live runtime

- App path: `/home/ubuntu/mechanic-clock`
- Service: `torqueclock.service`
- Local URL: `http://127.0.0.1:8799/`
- Tailnet URL: `http://100.82.165.23:8799/`
- Runtime data: `data.json` (ignored by git)

Run manually:

```bash
MECH_CLOCK_PORT=8799 python3 app.py
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

## Flat-rate efficiency tracking

TorqueClock tracks book (flat-rate) hours against actual clock hours so you can see how you're really doing, not just how long things took:

- **Book time editor** — Settings → Flat-rate (book) hours. Set the sold hours per operation; built-in defaults cover common jobs out of the box. Rates are stored server-side in `data.json` (`presets.book`), not the browser, so they travel with the shop and land in archives.
- **Efficiency badges** — every operation, and each Live Tally period (today/7 day/31 day), shows billed ÷ actual as a color badge: green ≥100%, amber 85–99%, red <85%, gray when no book time is set yet.
- **Efficiency by day of week / by time of day** — Stats page cards showing which weekdays and shop-hour windows run efficient vs. where time bleeds away.
- **Efficiency this range** — a quick billed-hours-vs-actual-hours summary at the top of Stats for whatever range you've selected.
- CSV export (Stats → Export CSV) includes weekday, time-of-day bucket, book hours, and efficiency % per line item.

## GitHub-style monthly archives

Use **Settings → Save GitHub-style month archive** or **Stats → Save month archive**.

That creates:

```text
archive/YYYY-MM/torqueclock-YYYY-MM-DDTHH-MM-SSZ.json
archive/YYYY-MM/monthly-summary.json
```

`data.json` stays local/ignored, while the organized `archive/YYYY-MM/` snapshots can be committed to GitHub when CAK3D wants that record saved.

Rollback/stop: `systemctl --user stop torqueclock.service` or restore from a backup/archive snapshot before replacing `data.json`.
