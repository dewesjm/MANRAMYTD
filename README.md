# MANRAM YTD

Clickable mockup: radiation dose year to date. Pick a department, enter a pernr, or both, and
search. Each person shows their supervisor level 2, supervisor level 1, name, department,
pernr, YTD dose, CNT (control) level, allowable, med date and training date, in a grid you can
sort, filter and download as CSV. Fake data only.

Its own app; Compass's (Forge's) MANRAM YTD tile links to it.

## Commands

| Command | What it does |
| --- | --- |
| `npm start` | The app on http://localhost:4208 |
| `npm test -- --watch=false` | Unit tests (Vitest) |
| `npm run build` | Build and typecheck |
| `npm run e2e` | Browser checks (Playwright + axe), phone and desktop, light and dark |
| `npm run sample-data` | Make `src/data/seed/dose-seed.json` again from ZORD's sample people (needs `C:\Users\dewes\Zord` beside this folder) |

Run `npm test` from `C:\Users\dewes\ManramYtd` with a capital `C:`; from `c:\...` Vitest fails
with "Vitest failed to find the runner".

## The data

One store, kept like tables in a database: each kind of record is its own list, and records
point at each other by pernr or department code. Nothing is stored twice: YTD dose, allowable
and supervisors' names are worked out when a search is shown. `src/domain/dose.ts` has the
types. Doses are in mrem.

| List | One record is | Points at |
| --- | --- | --- |
| `departments` | A department (`X11`, Pipe Shop) | |
| `people` | A person by pernr (`10062740`), with the other apps' id, name, title and their level 1 and level 2 supervisors | department, people |
| `profiles` | A person's control level for the year, last med date and last training date | person |
| `readings` | One dosimeter reading: day, device, hours in the area, dose | person |

- **YTD dose**: the readings from 1 January to the as-of day (2026-11-21 for the sample, so
  the numbers don't reset when a new year starts).
- **Allowable**: CNT level less YTD dose, never below zero.
- People without a dose profile (not radiation workers) show YTD 0 and empty limits and dates.

People are ZORD's (the same ids as MWQ, Deckfoot and ZORD). Departments, pernrs, reporting
lines, profiles and readings are made up by `scripts/make-sample-data.cjs`. A unit test checks
every link and format in the sample data (`integrityProblems`).

## The calls

Screens get dose data only through `DoseClient` (`src/data/dose-client.ts`). Today it reads the
sample data built into the app. Every call is a read. Admin > Services (Developers) runs each
call and shows it in full.

| Call | What it does |
| --- | --- |
| `search({ department, pernr })` | Everyone in the department and/or with the pernr (empty for any; at least one), sorted by department and name |
| `getDepartments()` | Every department, for the drop-down |
| `getReadings(pernr)` | One person's dosimeter readings, newest first |

## Linking from another app

Put the search in the address:

    /?department=X11
    /?pernr=10062740

A pernr is 8 digits.
