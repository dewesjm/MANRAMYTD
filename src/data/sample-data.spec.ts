import { integrityProblems, searchDose } from '../domain';
import seed from './seed/dose-seed.json';
import { SAMPLE_AS_OF, seedDoseBook, seedPersonas } from './seed';

describe('the sample dose data', () => {
  const book = seedDoseBook();

  it('reads in full: no record is dropped for being in the wrong shape', () => {
    expect(book.departments).toHaveLength(seed.departments.length);
    expect(book.people).toHaveLength(seed.people.length);
    expect(book.profiles).toHaveLength(seed.profiles.length);
    expect(book.readings).toHaveLength(seed.readings.length);
  });

  it('holds together: every link resolves, pernrs have the right format, reporting lines agree', () => {
    expect(integrityProblems(book)).toEqual([]);
  });

  it("uses the other apps' people, as of the day it was made", () => {
    expect(book.people.find((p) => p.id === 'u-foreman-haddad')).toMatchObject({ firstName: 'Rita', lastName: 'Haddad', department: 'X11' });
    expect(SAMPLE_AS_OF).toBe('2026-11-21');
  });

  it('has someone near their control level and someone over it, to try', () => {
    const rows = searchDose(book, { department: 'X11', pernr: '' }, SAMPLE_AS_OF);
    const umar = rows.find((r) => r.pernr === '10062740')!;
    expect(umar.ytdDose).toBeGreaterThan(400);
    expect(umar.allowable).toBeLessThan(100);
    expect(rows.some((r) => r.allowable === 0)).toBe(true);
  });

  it('offers View as people who are all in the sample, with one Developer', () => {
    const personas = seedPersonas();
    expect(personas).toHaveLength(11);
    expect(personas.filter((p) => p.role === 'developer').map((p) => p.id)).toEqual(['u-developer']);
  });
});
