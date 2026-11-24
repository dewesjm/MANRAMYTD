import { DoseBook, integrityProblems, pernrProblem, readingsOf, roundDose, searchDose, searchProblem } from './dose';

function book(): DoseBook {
  return {
    departments: [
      { code: 'X01', name: 'Management' },
      { code: 'X11', name: 'Pipe Shop' },
    ],
    people: [
      { pernr: '10000118', id: 'u-dir', firstName: 'Pat', lastName: 'Walsh', title: 'Director', department: 'X01', supervisor1: null, supervisor2: null },
      { pernr: '10000342', id: 'u-gf', firstName: 'Chris', lastName: 'Okafor', title: 'General Foreman', department: 'X01', supervisor1: '10000118', supervisor2: null },
      { pernr: '10001207', id: 'u-fm', firstName: 'Rita', lastName: 'Haddad', title: 'Pipe Foreman', department: 'X11', supervisor1: '10000342', supervisor2: '10000118' },
      { pernr: '10062740', id: 'u-uh', firstName: 'Umar', lastName: 'Haddad', title: 'Pipefitter', department: 'X11', supervisor1: '10001207', supervisor2: '10000342' },
      { pernr: '10010482', id: 'u-do', firstName: 'Dana', lastName: 'Ortiz', title: 'Pipefitter', department: 'X11', supervisor1: '10001207', supervisor2: '10000342' },
    ],
    profiles: [
      { pernr: '10062740', controlLevel: 500, medDate: '2026-03-02', trainingDate: '2025-08-14' },
      { pernr: '10010482', controlLevel: 250, medDate: '2025-11-20', trainingDate: '2026-01-09' },
    ],
    readings: [
      { pernr: '10062740', date: '2025-12-30', deviceId: 'D-1', hours: 4, dose: 90 },
      { pernr: '10062740', date: '2026-01-05', deviceId: 'D-1', hours: 4, dose: 100.1 },
      { pernr: '10062740', date: '2026-06-10', deviceId: 'D-1', hours: 8, dose: 200.2 },
      { pernr: '10062740', date: '2026-12-01', deviceId: 'D-1', hours: 2, dose: 50 },
      { pernr: '10010482', date: '2026-02-01', deviceId: 'D-2', hours: 6, dose: 300 },
    ],
  };
}

const AS_OF = '2026-11-21';

describe('pernrProblem and searchProblem', () => {
  it('accepts 8 digits, or nothing', () => {
    expect(pernrProblem(' 10062740 ')).toBeNull();
    expect(pernrProblem('')).toBeNull();
  });

  it('says what is wrong with a pernr', () => {
    expect(pernrProblem('1006274A')).toBe('A pernr is digits only.');
    expect(pernrProblem('1006274')).toBe('A pernr has 8 digits; this has 7.');
  });

  it('needs a department or a pernr', () => {
    expect(searchProblem({ department: '', pernr: ' ' })).toBe('Pick a department or enter a pernr.');
    expect(searchProblem({ department: 'X11', pernr: '' })).toBeNull();
    expect(searchProblem({ department: 'X11', pernr: '12' })).toBe('A pernr has 8 digits; this has 2.');
  });
});

describe('searchDose', () => {
  it('finds everyone in a department, by name, with supervisors as Last, First', () => {
    const rows = searchDose(book(), { department: 'X11', pernr: '' }, AS_OF);
    expect(rows.map((r) => r.name)).toEqual(['Haddad, Rita', 'Haddad, Umar', 'Ortiz, Dana']);
    expect(rows[1]).toMatchObject({ supervisor2: 'Okafor, Chris', supervisor1: 'Haddad, Rita', department: 'X11', departmentName: 'Pipe Shop' });
  });

  it("adds up this year's readings to the as-of day, and allowable is control level less YTD", () => {
    const [row] = searchDose(book(), { department: '', pernr: '10062740' }, AS_OF);
    expect(row).toMatchObject({ pernr: '10062740', ytdDose: 300.3, controlLevel: 500, allowable: 199.7, medDate: '2026-03-02', trainingDate: '2025-08-14' });
  });

  it('never shows allowable below zero', () => {
    const [row] = searchDose(book(), { department: '', pernr: '10010482' }, AS_OF);
    expect(row).toMatchObject({ ytdDose: 300, controlLevel: 250, allowable: 0 });
  });

  it('leaves limits and dates empty for someone without a dose profile', () => {
    const [row] = searchDose(book(), { department: '', pernr: '10001207' }, AS_OF);
    expect(row).toMatchObject({ ytdDose: 0, controlLevel: null, allowable: null, medDate: null, trainingDate: null });
  });

  it('needs both to match when both are given, and finds nobody otherwise', () => {
    expect(searchDose(book(), { department: 'X11', pernr: '10062740' }, AS_OF)).toHaveLength(1);
    expect(searchDose(book(), { department: 'X01', pernr: '10062740' }, AS_OF)).toEqual([]);
  });

  it('shows empty supervisors at the top of the line', () => {
    const [row] = searchDose(book(), { department: '', pernr: '10000118' }, AS_OF);
    expect(row).toMatchObject({ supervisor1: '', supervisor2: '' });
  });
});

describe('readingsOf', () => {
  it("lists one person's readings, newest first", () => {
    expect(readingsOf(book(), '10062740').map((r) => r.date)).toEqual(['2026-12-01', '2026-06-10', '2026-01-05', '2025-12-30']);
  });
});

describe('roundDose', () => {
  it('rounds to one decimal', () => {
    expect(roundDose(100.1 + 200.2)).toBe(300.3);
  });
});

describe('integrityProblems', () => {
  it('is empty for a sound store', () => {
    expect(integrityProblems(book())).toEqual([]);
  });

  it('finds broken links, bad formats, duplicates and a broken reporting line', () => {
    const b = book();
    b.people[4].department = 'X99';
    b.people[4].supervisor2 = '10000118';
    b.people.push({ ...b.people[0], id: 'u-x', pernr: '123' });
    b.profiles.push({ pernr: '10062740', controlLevel: 0, medDate: '2026-01-01', trainingDate: '2026-01-01' });
    b.readings.push({ pernr: '19999999', date: '2026-01-01', deviceId: 'D-9', hours: 1, dose: 1 });
    expect(integrityProblems(b)).toEqual([
      'Two dose profiles for 10062740.',
      "10010482 is in department X99, which isn't there.",
      "10010482's level 2 supervisor isn't their level 1 supervisor's supervisor.",
      'Pernr 123 is not in the right format.',
      "10062740's control level is 0.",
      "A reading points at 19999999, who isn't there.",
    ]);
  });
});
