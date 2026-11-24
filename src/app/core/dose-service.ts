import { Injectable, inject, signal } from '@angular/core';
import { Department, DoseRow, DoseSearch, searchProblem } from '../../domain';
import { DOSE_CLIENT } from './tokens';

/** What the page shows: nothing searched yet, a problem with the search, the results, or a failed call. */
export type SearchState =
  | { kind: 'empty' }
  | { kind: 'invalid'; problem: string }
  | { kind: 'results'; search: DoseSearch; rows: DoseRow[] }
  | { kind: 'failed'; message: string };

/** The dose data for the screens: the departments (loaded at start) and the current search. */
@Injectable({ providedIn: 'root' })
export class DoseService {
  private readonly client = inject(DOSE_CLIENT);

  readonly departments = signal<readonly Department[]>([]);
  readonly state = signal<SearchState>({ kind: 'empty' });
  readonly busy = signal(false);
  /** The day YTD runs to. */
  readonly asOf = this.client.asOf;
  private revision = 0;

  async load(): Promise<void> {
    this.departments.set(await this.client.getDepartments());
  }

  /** Runs a search. A slower earlier search never replaces a later one's results. */
  async search(search: DoseSearch): Promise<void> {
    const revision = ++this.revision;
    const query = { department: search.department.trim(), pernr: search.pernr.trim() };
    if (!query.department && !query.pernr) {
      this.state.set({ kind: 'empty' });
      return;
    }
    const problem = searchProblem(query);
    if (problem) {
      this.state.set({ kind: 'invalid', problem });
      return;
    }
    this.busy.set(true);
    try {
      const rows = await this.client.search(query);
      if (revision === this.revision) this.state.set({ kind: 'results', search: query, rows });
    } catch (error) {
      if (revision === this.revision) this.state.set({ kind: 'failed', message: error instanceof Error ? error.message : String(error) });
    } finally {
      if (revision === this.revision) this.busy.set(false);
    }
  }

  /** The client itself, for Admin > Services, which shows and runs its calls directly. */
  get doseClient() {
    return this.client;
  }
}
