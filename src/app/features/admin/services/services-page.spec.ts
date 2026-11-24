import { TestBed } from '@angular/core/testing';
import { DemoDataService } from '../../../core/demo-data-service';
import { ViewerService } from '../../../core/viewer-service';
import { ServicesPage } from './services-page';

describe('ServicesPage', () => {
  beforeEach(() => localStorage.clear());

  async function render() {
    await TestBed.inject(DemoDataService).load();
    TestBed.inject(ViewerService).setPersona('u-developer');
    const fixture = TestBed.createComponent(ServicesPage);
    await fixture.whenStable();
    const page = fixture.nativeElement as HTMLElement;
    const select = page.querySelector('select')!;
    const choose = async (name: string) => {
      select.value = name;
      select.dispatchEvent(new Event('change'));
      await fixture.whenStable();
    };
    const type = async (text: string) => {
      const box = page.querySelector('textarea')!;
      box.value = text;
      box.dispatchEvent(new Event('input'));
      await fixture.whenStable();
    };
    const run = async () => {
      page.querySelector<HTMLButtonElement>('button.btn-primary')!.click();
      await vi.waitFor(() => expect(page.querySelector('[data-testid="response"]')).not.toBeNull());
      return page.querySelector('[data-testid="response"]')!.textContent!;
    };
    const call = () => page.querySelector('[data-testid="full-call"]')?.textContent ?? '';
    return { page, choose, type, run, call };
  }

  it('searches the example department by default, showing the call', async () => {
    const { call, run } = await render();
    expect(call()).toContain('search(');
    expect(call()).toContain('"department": "X11"');
    const rows = JSON.parse(await run());
    expect(rows.length).toBeGreaterThan(5);
    expect(rows.every((r: { department: string }) => r.department === 'X11')).toBe(true);
  });

  it('lists every call as a read', async () => {
    const { page } = await render();
    const options = [...page.querySelectorAll('option')].map((o) => o.textContent!.trim());
    expect(options).toEqual(['search (read)', 'getDepartments (read)', 'getReadings (read)']);
  });

  it("reads one person's readings", async () => {
    const { choose, run, call } = await render();
    await choose('DoseClient.getReadings');
    expect(call()).toContain('getReadings("10062740")');
    const readings = JSON.parse(await run());
    expect(readings.length).toBeGreaterThan(0);
    expect(readings[0]).toHaveProperty('deviceId');
  });

  it('refuses a search with neither a department nor a pernr, and a bad pernr, saying why', async () => {
    const { type, page } = await render();
    await type('{ "department": "", "pernr": "" }');
    expect(page.textContent).toContain('Pick a department or enter a pernr.');
    await type('{ "department": "", "pernr": "123" }');
    expect(page.textContent).toContain('A pernr has 8 digits; this has 3.');
  });
});
