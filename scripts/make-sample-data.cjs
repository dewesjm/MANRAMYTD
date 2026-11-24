// Makes MANRAM YTD's sample data (src/data/seed/dose-seed.json) from ZORD's sample people (the
// same people and ids as MWQ, Deckfoot and ZORD), adding departments, pernrs, the reporting
// line, dose profiles and dosimeter readings. Seeded, so the same every run. As of 2026-11-21.
// Run: npm run sample-data
const fs = require('fs');
const path = require('path');

const source = process.argv[3] ? path.resolve(process.argv[3]) : path.resolve(__dirname, '../../Zord/src/data/seed/zord-seed.json');
const out = process.argv[2] ? path.resolve(process.argv[2]) : path.resolve(__dirname, '../src/data/seed/dose-seed.json');
const zord = JSON.parse(fs.readFileSync(source, 'utf8'));
const AS_OF = '2026-11-21';

let s = 20261124;
const rand = () => {
  s |= 0; s = (s + 0x6d2b79f5) | 0;
  let t = Math.imul(s ^ (s >>> 15), 1 | s);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const int = (a, b) => a + Math.floor(rand() * (b - a + 1));
const addDays = (iso, n) => { const d = new Date(iso + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const isWeekend = (iso) => [0, 6].includes(new Date(iso + 'T00:00:00Z').getUTCDay());

// Made up, like everything here.
const DEPARTMENTS = {
  management: { code: 'X01', name: 'Ship Repair Management' },
  it: { code: 'X09', name: 'Information Technology' },
  pipefitter: { code: 'X11', name: 'Pipe Shop' },
  welder: { code: 'X26', name: 'Weld Shop' },
  machinist: { code: 'X31', name: 'Machine Shop' },
  electrician: { code: 'X51', name: 'Electrical Shop' },
  rigger: { code: 'X72', name: 'Rigging' },
};
const FOREMAN = {
  pipefitter: 'u-foreman-haddad', welder: 'u-foreman-nguyen', machinist: 'u-foreman-brennan',
  electrician: 'u-foreman-ito', rigger: 'u-foreman-mendez',
};
const DIRECTOR = 'u-director';
const GENERAL_FOREMAN = 'u-general-foreman';
/** Not radiation workers: no dose profile and no readings. */
const NOT_RAD_WORKERS = new Set(['u-admin', 'u-developer']);

const pernrOf = new Map(zord.people.map((p) => [p.id, '1' + p.employeeNumber.replace(/\D/g, '').padStart(7, '0')]));

/** Level 1 supervisor's id: mechanics report to their trade's foreman, foremen to the general foreman, the rest to the director. */
function supervisorOf(p) {
  if (p.id === DIRECTOR) return null;
  if (p.id === GENERAL_FOREMAN || p.trade === 'management' || p.trade === 'it') return DIRECTOR;
  if (Object.values(FOREMAN).includes(p.id)) return GENERAL_FOREMAN;
  return FOREMAN[p.trade];
}
const byId = new Map(zord.people.map((p) => [p.id, p]));

const people = zord.people.map((p) => {
  const [firstName, ...rest] = p.name.split(' ');
  const level1 = supervisorOf(p);
  const level2 = level1 ? supervisorOf(byId.get(level1)) : null;
  return {
    pernr: pernrOf.get(p.id),
    id: p.id,
    firstName,
    lastName: rest.join(' '),
    title: p.title,
    department: DEPARTMENTS[p.trade].code,
    supervisor1: level1 ? pernrOf.get(level1) : null,
    supervisor2: level2 ? pernrOf.get(level2) : null,
  };
});

const radWorkers = zord.people.filter((p) => !NOT_RAD_WORKERS.has(p.id));
const dateBetween = (from, days) => addDays(from, int(0, days));

const profiles = radWorkers.map((p) => ({
  pernr: pernrOf.get(p.id),
  // Apprentices and managers get a lower control level; a few experienced hands a higher one.
  controlLevel: /Apprentice/.test(p.title) || p.trade === 'management' ? 250 : rand() < 0.15 ? 1000 : 500,
  medDate: dateBetween('2024-12-01', 700),
  trainingDate: dateBetween('2025-01-15', 670),
}));

// Readings: some workdays from last October to the as-of day (last year's don't count toward YTD).
// Shop people pick up more than managers. One pipefitter is close to their control level; one
// apprentice is just over theirs.
const readings = [];
let device = 20400;
for (const p of radWorkers) {
  const deviceId = `D-${device++}`;
  const shop = p.trade !== 'management';
  const chance = shop ? 0.11 : 0.02;
  const target = { 'u-umar-haddad': 470, 'u-pipefitter-3': 268 }[p.id] ?? null;
  let total2026 = 0;
  for (let d = '2025-10-01'; d <= AS_OF; d = addDays(d, 1)) {
    if (isWeekend(d) || rand() > chance) continue;
    const hours = int(2, 16) / 2;
    let dose = Math.round(hours * (shop ? 0.4 + rand() * 3.2 : 0.2 + rand() * 0.8) * 10) / 10;
    if (target !== null && d >= '2026-01-01') dose = Math.round(dose * 2.6 * 10) / 10;
    if (d >= '2026-01-01') {
      if (target !== null && total2026 + dose > target) continue;
      total2026 += dose;
    }
    readings.push({ pernr: pernrOf.get(p.id), date: d, deviceId, hours, dose });
  }
}

const seed = {
  $comment: "MANRAM YTD sample data, made from ZORD's people (same ids as MWQ, Deckfoot and ZORD) plus departments, pernrs, reporting lines, dose profiles and dosimeter readings. Doses in mrem. Fake data only. Made by scripts/make-sample-data.cjs; don't edit by hand.",
  asOf: AS_OF,
  departments: Object.values(DEPARTMENTS),
  people,
  profiles,
  readings,
};
fs.writeFileSync(out, JSON.stringify(seed, null, 2) + '\n');
console.log(`Wrote ${out}: ${people.length} people, ${profiles.length} profiles, ${readings.length} readings.`);
