/*
 * Change Log (Quick Links > Change Log). Plain-language summary for people using the demo,
 * newest day first. Add to the top entry (or a new day) in the same commit as every change users
 * would notice, under Added, Changed or Fixed. Say what changed for the user, not how; keep each
 * line short. Internal work (refactoring, tests, docs) stays out.
 */
export interface ChangeLogDay {
  /** ISO date, e.g. 2026-11-10. */
  date: string;
  added?: readonly string[];
  changed?: readonly string[];
  fixed?: readonly string[];
}

export const CHANGE_LOG: readonly ChangeLogDay[] = [
  {
    date: '2026-11-24',
    added: [
      'MANRAM YTD: radiation dose year to date. Pick a department, enter a pernr, or both, and search.',
      'Each person shows their level 2 and level 1 supervisors, name, department, pernr, YTD dose, CNT level, allowable, med date and training date. Sort, filter and download the results as CSV.',
      'The address holds the search, so you can bookmark it or link to it.',
      'Admin > Services (Developers): try every call the app makes and see the full call.',
      'View as, the theme picker and Quick Links with this Change Log.',
    ],
  },
];
