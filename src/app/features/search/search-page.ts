import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs';
import { searchProblem } from '../../../domain';
import { DoseService } from '../../core/dose-service';
import { DataGrid } from '../../shared/data-grid/data-grid';
import { Icon } from '../../shared/icon/icon';
import { DOSE_COLUMNS, formatDate } from './dose-columns';

/**
 * The one page: pick a department, enter a pernr, or both, and see each person's dose year to
 * date. The search is in the address (?department=…&pernr=…), so it can be bookmarked or linked
 * to, and Back works.
 */
@Component({
  selector: 'mr-search-page',
  imports: [DataGrid, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block space-y-6' },
  template: `
    <form class="space-y-1" (submit)="submit($event)" novalidate aria-describedby="search-hint">
      <div class="flex flex-wrap items-end gap-2">
        <label class="flex w-full flex-col gap-1 font-medium sm:w-64">
          Department
          <select id="department" class="select w-full" [value]="department()" (change)="department.set($any($event.target).value)">
            <option value="">Any department</option>
            @for (d of dose.departments(); track d.code) {
              <option [value]="d.code" [selected]="d.code === department()">{{ d.code }} {{ d.name }}</option>
            }
          </select>
        </label>
        <label class="flex w-full flex-col gap-1 font-medium sm:w-48">
          Pernr
          <input
            id="pernr"
            type="text"
            inputmode="numeric"
            autocomplete="off"
            class="input w-full"
            [class.input-error]="problem()"
            [value]="pernr()"
            (input)="pernr.set($any($event.target).value)"
            [attr.aria-invalid]="problem() ? true : null"
          />
        </label>
        <button type="submit" class="btn btn-primary" [disabled]="dose.busy()">Search</button>
      </div>
      @if (problem(); as message) {
        <p id="search-hint" class="flex items-center gap-1 text-sm" data-testid="problem">
          <mr-icon name="triangle-alert" class="size-4 shrink-0 text-error" />{{ message }}
        </p>
      } @else {
        <p id="search-hint" class="text-sm">Pick a department, enter a pernr (8 digits), or both.</p>
      }
    </form>

    @if (rows(); as found) {
      <section class="space-y-2" aria-labelledby="results-heading">
        <h1 id="results-heading" class="text-2xl font-semibold">Dose year to date</h1>
        <p data-testid="as-of">As of {{ asOf }}. Doses in mrem. Allowable is the CNT level less YTD dose.</p>
        <mr-data-grid label="Dose" [columns]="columns" [rows]="found" [fileName]="fileName()" />
      </section>
    } @else {
      <h1 class="sr-only">MANRAM YTD</h1>
      @if (failed(); as message) {
        <div role="alert" class="alert alert-error">Couldn't search: {{ message }}</div>
      } @else {
        <p>Radiation dose year to date: each person's dosimeter readings added up for the year, against their control level.</p>
      }
    }
  `,
})
export class SearchPage {
  protected readonly dose = inject(DoseService);
  private readonly router = inject(Router);
  protected readonly columns = DOSE_COLUMNS;
  protected readonly asOf = formatDate(this.dose.asOf);

  private readonly fromAddress = toSignal(
    inject(ActivatedRoute).queryParamMap.pipe(
      map((params) => ({ department: params.get('department') ?? '', pernr: params.get('pernr') ?? '' })),
    ),
    { initialValue: { department: '', pernr: '' } },
  );
  /** What's in the form. Follows the address, so Back and links fill it in. */
  protected readonly department = signal('');
  protected readonly pernr = signal('');
  /** A problem with what was searched; shown until the next search. */
  protected readonly problem = signal<string | null>(null);

  protected readonly rows = computed(() => {
    const state = this.dose.state();
    return state.kind === 'results' ? state.rows : null;
  });
  protected readonly failed = computed(() => {
    const state = this.dose.state();
    return state.kind === 'failed' ? state.message : null;
  });
  protected readonly fileName = computed(() => {
    const state = this.dose.state();
    if (state.kind !== 'results') return 'manram-ytd';
    return ['manram-ytd', state.search.department, state.search.pernr].filter(Boolean).join('-');
  });

  constructor() {
    effect(() => {
      const search = this.fromAddress();
      this.department.set(search.department);
      this.pernr.set(search.pernr);
      const empty = !search.department.trim() && !search.pernr.trim();
      this.problem.set(empty ? null : searchProblem(search));
      void this.dose.search(search);
    });
  }

  protected submit(event: Event): void {
    event.preventDefault();
    const search = { department: this.department(), pernr: this.pernr().trim() };
    const problem = searchProblem(search);
    this.problem.set(problem);
    if (problem) {
      document.getElementById(search.pernr ? 'pernr' : 'department')?.focus();
      return;
    }
    const current = this.fromAddress();
    if (current.department === search.department && current.pernr.trim() === search.pernr) void this.dose.search(search);
    else {
      void this.router.navigate(['/'], {
        queryParams: { department: search.department || null, pernr: search.pernr || null },
      });
    }
  }
}
