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

## GitHub-style monthly archives

Use **Settings → Save GitHub-style month archive** or **Stats → Save month archive**.

That creates:

```text
archive/YYYY-MM/torqueclock-YYYY-MM-DDTHH-MM-SSZ.json
archive/YYYY-MM/monthly-summary.json
```

`data.json` stays local/ignored, while the organized `archive/YYYY-MM/` snapshots can be committed to GitHub when CAK3D wants that record saved.

Rollback/stop: `systemctl --user stop torqueclock.service` or restore from a backup/archive snapshot before replacing `data.json`.
