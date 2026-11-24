import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { DemoDataService } from '../../core/demo-data-service';
import { SearchPage } from './search-page';

describe('SearchPage', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideRouter([{ path: '', component: SearchPage }])] });
  });

  async function open(url = '/') {
    await TestBed.inject(DemoDataService).load();
    const harness = await RouterTestingHarness.create(url);
    const page = harness.routeNativeElement!;
    const settle = async () => {
      await harness.fixture.whenStable();
      harness.detectChanges();
    };
    await settle();
    const select = () => page.querySelector<HTMLSelectElement>('#department')!;
    const pernr = () => page.querySelector<HTMLInputElement>('#pernr')!;
    const pick = (code: string) => {
      select().value = code;
      select().dispatchEvent(new Event('change'));
    };
    const type = (text: string) => {
      pernr().value = text;
      pernr().dispatchEvent(new Event('input'));
    };
    const submit = async () => {
      page.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
      await settle();
    };
    const headers = () => [...page.querySelectorAll('thead th')].map((th) => th.textContent!.trim());
    const rows = () =>
      [...page.querySelectorAll('tbody tr')].map((tr) => [...tr.querySelectorAll('td')].map((td) => td.textContent!.trim()));
    return { page, select, pernr, pick, type, submit, headers, rows };
  }

  it('offers every department in the drop-down, after Any department', async () => {
    const { select } = await open();
    const options = [...select().options].map((o) => o.textContent!.trim());
    expect(options[0]).toBe('Any department');
    expect(options).toContain('X11 Pipe Shop');
    expect(options).toHaveLength(8);
  });

  it('searches a department, putting it in the address, with the columns in the order asked for', async () => {
    const { pick, submit, headers, rows, page } = await open();
    pick('X11');
    await submit();
    expect(TestBed.inject(Router).url).toBe('/?department=X11');
    expect(headers()).toEqual([
      'Supervisor level 2', 'Supervisor level 1', 'Name', 'Department', 'Pernr',
      'YTD Dose (mrem)', 'CNT Level (mrem)', 'Allowable (mrem)', 'Med Date', 'Training Date',
    ]);
    const found = rows();
    expect(found.length).toBeGreaterThan(5);
    expect(found.every((r) => r[3] === 'X11 Pipe Shop')).toBe(true);
    expect(page.querySelector('[data-testid="as-of"]')?.textContent).toContain('Nov 21, 2026');
  });

  it('searches one pernr: a pipefitter with both supervisors, and allowable is CNT level less YTD', async () => {
    const { type, submit, rows } = await open();
    type('10062740');
    await submit();
    const [row] = rows();
    expect(rows()).toHaveLength(1);
    expect(row.slice(0, 5)).toEqual(['Okafor, Chris', 'Haddad, Rita', 'Haddad, Umar', 'X11 Pipe Shop', '10062740']);
    const [ytd, cnt, allowable] = row.slice(5, 8).map((x) => Number(x.replace(/,/g, '')));
    expect(cnt).toBe(500);
    expect(allowable).toBeCloseTo(cnt - ytd, 1);
    expect(row[8]).toMatch(/^[A-Z][a-z]{2} \d{1,2}, \d{4}$/);
  });

  it('opens straight to a search from a link, filling in the form', async () => {
    const { select, pernr, rows } = await open('/?department=X26&pernr=10020917');
    expect(select().value).toBe('X26');
    expect(pernr().value).toBe('10020917');
    expect(rows().map((r) => r[2])).toEqual(['Kowalski, Sam']);
  });

  it('asks for a department or a pernr, and says why a pernr is wrong, without searching', async () => {
    const { submit, type, page } = await open();
    await submit();
    expect(page.querySelector('[data-testid="problem"]')?.textContent).toContain('Pick a department or enter a pernr.');
    type('1234');
    await submit();
    expect(page.querySelector('[data-testid="problem"]')?.textContent).toContain('A pernr has 8 digits; this has 4.');
    expect(TestBed.inject(Router).url).toBe('/');
    expect(page.querySelector('table')).toBeNull();
  });

  it('shows an empty grid when no one matches', async () => {
    const { page } = await open('/?pernr=19999999');
    expect(page.querySelector('tbody')?.textContent).toContain('Nothing to show.');
  });

  it('leaves the dose columns empty for someone with no dose profile', async () => {
    const { rows } = await open('/?pernr=10009001');
    const [row] = rows();
    expect(row[2]).toBe('Ellis, Cameron');
    expect(row.slice(5)).toEqual(['0', '', '', '', '']);
  });
});
