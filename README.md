# GearLoop — community sports equipment sharing

Idea **03 · Sports & Fitness**: let communities share sports equipment through **bookings, availability and return tracking**.

## Features

- **Browse gear** – search, filter by sport / community / "free today".
- **Live availability** – per-day free units; fully booked days are crossed out on the calendar.
- **Bookings** – date-range booking with validation (max loan days, units, no double-booking).
- **Return tracking** – Booked → Picked up → Returned timeline, overdue flags (overdue units stay blocked), condition logged on return, damaged/missing units pulled from circulation until marked repaired.
- **Return tracker** – everything out, due today, overdue, upcoming and history.
- **Share gear** – list your own equipment with live preview.

## Run

```sh
bun install   # or npm install
bun run dev
bun run test
bun run build
```

Data lives in the browser (`localStorage`), seeded with demo data on first load (profile menu → "Reset demo data").
For a real backend, replace `commit` in `src/lib/store.ts`.
