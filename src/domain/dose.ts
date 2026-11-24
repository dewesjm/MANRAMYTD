/*
 * Radiation dose year to date (MANRAM YTD): each person's dosimeter readings added up for the
 * year, against their control level. Kept as separate lists that point at each other by pernr
 * or department code, like tables in a database. Nothing is stored twice: YTD dose, allowable,
 * names and supervisors' names are worked out when a search is shown. Doses are in mrem.
 */

/** A personnel number: 8 digits. */
export const PERNR_PATTERN = /^\d{8}$/;

export interface Department {
  /** Like X41. */
  code: string;
  name: string;
}

/** Someone who may work in radiation areas, with their place in the reporting line. */
export interface Person {
  pernr: string;
  /** The id the other apps (MWQ, Deckfoot, ZORD) use for this person. */
  id: string;
  firstName: string;
  lastName: string;
  title: string;
  department: string;
  /** Pernr of their supervisor (level 1), and of that person's supervisor (level 2); null at the top. */
  supervisor1: string | null;
  supervisor2: string | null;
}

/** A person's dose limits and qualification dates. */
export interface DoseProfile {
  pernr: string;
  /** The control level for the year, in mrem. */
  controlLevel: number;
  /** Last radiation medical exam, ISO date. */
  medDate: string;
  /** Last radiation worker training, ISO date. */
  trainingDate: string;
}

/** One reading off a dosimeter: time spent in the area and the dose picked up, on one day. */
export interface Reading {
  pernr: string;
  /** ISO date. */
  date: string;
  /** The dosimeter, like D-20417. */
  deviceId: string;
  hours: number;
  /** In mrem. */
  dose: number;
}

/** The whole store: a list per kind of record. */
export interface DoseBook {
  departments: Department[];
  people: Person[];
  profiles: DoseProfile[];
  readings: Reading[];
}

/** One row of the results. */
export interface DoseRow {
  supervisor2: string;
  supervisor1: string;
  /** Last, First. */
  name: string;
  department: string;
  departmentName: string;
  pernr: string;
  /** Readings this year, in mrem. */
  ytdDose: number;
  /** In mrem; null when the person has no dose profile. */
  controlLevel: number | null;
  /** Control level less YTD dose, never below zero; null without a profile. */
  allowable: number | null;
  medDate: string | null;
  trainingDate: string | null;
}

export interface DoseSearch {
  /** A department code, or empty for any. */
  department: string;
  /** A pernr, or empty for any. */
  pernr: string;
}

/** Dose to one decimal place, so adding readings never shows 0.30000000000000004. */
export function roundDose(dose: number): number {
  return Math.round(dose * 10) / 10;
}

/** What's wrong with a typed pernr, or null when it's empty or in the right format. */
export function pernrProblem(text: string): string | null {
  const value = text.trim();
  if (!value) return null;
  if (!/^\d+$/.test(value)) return 'A pernr is digits only.';
  if (!PERNR_PATTERN.test(value)) return `A pernr has 8 digits; this has ${value.length}.`;
  return null;
}

/** What stops a search, or null when it can run: a department or a pernr, and a pernr in the right format. */
export function searchProblem(search: DoseSearch): string | null {
  if (!search.department.trim() && !search.pernr.trim()) return 'Pick a department or enter a pernr.';
  return pernrProblem(search.pernr);
}

/** Last, First, or the pernr when there's no such person. */
export function displayName(person: Person | undefined, pernr: string): string {
  return person ? `${person.lastName}, ${person.firstName}` : pernr;
}

/**
 * Everyone matching the search, as of a day: in the department (when one is picked) and with
 * the pernr (when one is entered). YTD dose is the readings from 1 January of `asOf`'s year to
 * `asOf`. Sorted by department, then name.
 */
export function searchDose(book: DoseBook, search: DoseSearch, asOf: string): DoseRow[] {
  const department = search.department.trim();
  const pernr = search.pernr.trim();
  const people = new Map(book.people.map((p) => [p.pernr, p]));
  const departments = new Map(book.departments.map((d) => [d.code, d]));
  const profiles = new Map(book.profiles.map((p) => [p.pernr, p]));
  const yearStart = `${asOf.slice(0, 4)}-01-01`;
  const ytd = new Map<string, number>();
  for (const r of book.readings) {
    if (r.date >= yearStart && r.date <= asOf) ytd.set(r.pernr, (ytd.get(r.pernr) ?? 0) + r.dose);
  }
  const supervisor = (p: string | null) => (p ? displayName(people.get(p), p) : '');

  return book.people
    .filter((p) => (!department || p.department === department) && (!pernr || p.pernr === pernr))
    .map((p): DoseRow => {
      const profile = profiles.get(p.pernr);
      const ytdDose = roundDose(ytd.get(p.pernr) ?? 0);
      return {
        supervisor2: supervisor(p.supervisor2),
        supervisor1: supervisor(p.supervisor1),
        name: displayName(p, p.pernr),
        department: p.department,
        departmentName: departments.get(p.department)?.name ?? '',
        pernr: p.pernr,
        ytdDose,
        controlLevel: profile?.controlLevel ?? null,
        allowable: profile ? roundDose(Math.max(0, profile.controlLevel - ytdDose)) : null,
        medDate: profile?.medDate ?? null,
        trainingDate: profile?.trainingDate ?? null,
      };
    })
    .sort((a, b) => a.department.localeCompare(b.department) || a.name.localeCompare(b.name));
}

/** One person's readings, newest first. */
export function readingsOf(book: DoseBook, pernr: string): Reading[] {
  return book.readings
    .filter((r) => r.pernr === pernr.trim())
    .sort((a, b) => b.date.localeCompare(a.date) || a.deviceId.localeCompare(b.deviceId));
}

/**
 * Everything that would make the store disagree with itself: bad formats, duplicates, and
 * records pointing at something that isn't there. Empty when the store is sound. The sample
 * data must pass it (unit test).
 */
export function integrityProblems(book: DoseBook): string[] {
  const problems: string[] = [];
  const unique = (values: string[], what: string) => {
    const seen = new Set<string>();
    for (const v of values) {
      if (seen.has(v)) problems.push(`Two ${what} ${v}.`);
      seen.add(v);
    }
    return seen;
  };
  const departments = unique(book.departments.map((d) => d.code), 'departments coded');
  const pernrs = unique(book.people.map((p) => p.pernr), 'people with pernr');
  unique(book.people.map((p) => p.id), 'people with id');
  unique(book.profiles.map((p) => p.pernr), 'dose profiles for');

  const byPernr = new Map(book.people.map((p) => [p.pernr, p]));
  for (const p of book.people) {
    if (!PERNR_PATTERN.test(p.pernr)) problems.push(`Pernr ${p.pernr} is not in the right format.`);
    if (!departments.has(p.department)) problems.push(`${p.pernr} is in department ${p.department}, which isn't there.`);
    for (const s of [p.supervisor1, p.supervisor2]) {
      if (s !== null && !pernrs.has(s)) problems.push(`${p.pernr}'s supervisor ${s} isn't there.`);
    }
    if (p.supervisor1 === null && p.supervisor2 !== null) problems.push(`${p.pernr} has a level 2 supervisor but no level 1.`);
    const level1 = p.supervisor1 === null ? undefined : byPernr.get(p.supervisor1);
    if (level1 && level1.supervisor1 !== p.supervisor2) {
      problems.push(`${p.pernr}'s level 2 supervisor isn't their level 1 supervisor's supervisor.`);
    }
  }
  for (const p of book.profiles) {
    if (!pernrs.has(p.pernr)) problems.push(`A dose profile points at ${p.pernr}, who isn't there.`);
    if (!(p.controlLevel > 0)) problems.push(`${p.pernr}'s control level is ${p.controlLevel}.`);
  }
  for (const r of book.readings) {
    if (!pernrs.has(r.pernr)) problems.push(`A reading points at ${r.pernr}, who isn't there.`);
    if (r.dose < 0 || r.hours <= 0) problems.push(`A reading for ${r.pernr} on ${r.date} has ${r.hours} hours and ${r.dose} mrem.`);
  }
  return problems;
}
