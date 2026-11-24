import { Department, DoseRow, DoseSearch, Reading, readingsOf, searchDose } from '../../domain';
import { DoseCall, DoseClient } from '../dose-client';
import { SAMPLE_AS_OF, seedDoseBook } from '../seed';

/**
 * The sample dose data built into the app. Read only, so nothing is saved in the browser. YTD
 * runs to the day the sample was made (SAMPLE_AS_OF), so the numbers don't drop to zero when a
 * new year starts.
 */
export class SampleDoseClient implements DoseClient {
  readonly where = 'the sample dose data built into this app';
  readonly asOf = SAMPLE_AS_OF;
  private readonly book = seedDoseBook();

  async getDepartments(): Promise<Department[]> {
    return [...this.book.departments].sort((a, b) => a.code.localeCompare(b.code));
  }

  async search(search: DoseSearch): Promise<DoseRow[]> {
    return searchDose(this.book, search, this.asOf);
  }

  async getReadings(pernr: string): Promise<Reading[]> {
    return readingsOf(this.book, pernr);
  }

  describe(call: DoseCall): string {
    switch (call.name) {
      case 'getDepartments':
        return 'getDepartments()\nLists the sample departments built into this app.';
      case 'search':
        return `search(${JSON.stringify(call.search, null, 2)})\nSearches the sample people built into this app; YTD runs to ${this.asOf}.`;
      case 'getReadings':
        return `getReadings(${JSON.stringify(call.pernr)})\nReads one person's sample dosimeter readings.`;
    }
  }
}
