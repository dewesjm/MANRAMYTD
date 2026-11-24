import { Department, DoseRow, DoseSearch, Reading } from '../domain';

/**
 * Everything MANRAM YTD reads. Screens use it only through the core services (src/app/core).
 * One version today, SampleDoseClient: the sample data built into the app. A real service would
 * be a second version with the same calls; the screens wouldn't change. Every call is a read.
 */
export interface DoseClient {
  /** Where the data comes from, for people to read. */
  readonly where: string;
  /** The day YTD runs to. */
  readonly asOf: string;
  /** Every department, for the drop-down. */
  getDepartments(): Promise<Department[]>;
  /** Everyone in the department and/or with the pernr, with their YTD dose, limits and dates. */
  search(search: DoseSearch): Promise<DoseRow[]>;
  /** One person's dosimeter readings, newest first (what YTD dose adds up). */
  getReadings(pernr: string): Promise<Reading[]>;
  /** The call as text, for Admin > Services. */
  describe(call: DoseCall): string;
}

export type DoseCall =
  | { name: 'getDepartments' }
  | { name: 'search'; search: DoseSearch }
  | { name: 'getReadings'; pernr: string };
