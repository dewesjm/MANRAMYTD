import { inject } from '@angular/core';
import { pernrProblem, searchProblem } from '../../../../domain';
import { DoseService } from '../../../core/dose-service';

export interface ServiceOperation {
  name: string;
  description: string;
  writes: boolean;
  example?: unknown;
  /** The call as text, and how to run it. */
  prepare(input: unknown): { call: string; run(): unknown };
}

/**
 * The app's calls, run straight against the dose data, so Admin > Services shows exactly what
 * the screens get. Every call in DoseClient is here. All are reads.
 */
export function doseOperations(): ServiceOperation[] {
  const client = inject(DoseService).doseClient;

  return [
    {
      name: 'DoseClient.search',
      description:
        'Search by department, by pernr, or both (leave one empty for any). Returns each person with their level 2 and level 1 supervisors, name, department, pernr, YTD dose, control level, allowable, med date and training date. Doses in mrem.',
      writes: false,
      example: { department: 'X11', pernr: '' },
      prepare(input) {
        const value = input as { department?: unknown; pernr?: unknown } | null;
        if (!value || typeof value !== 'object' || typeof value.department !== 'string' || typeof value.pernr !== 'string') {
          throw new Error('Enter a JSON object with department and pernr, each text (empty for any).');
        }
        // The same checks as the search form.
        const search = { department: value.department.trim(), pernr: value.pernr.trim() };
        const problem = searchProblem(search);
        if (problem) throw new Error(problem);
        return { call: client.describe({ name: 'search', search }), run: () => client.search(search) };
      },
    },
    {
      name: 'DoseClient.getDepartments',
      description: 'List every department (code and name), as the drop-down shows them.',
      writes: false,
      prepare: () => ({ call: client.describe({ name: 'getDepartments' }), run: () => client.getDepartments() }),
    },
    {
      name: 'DoseClient.getReadings',
      description: "One person's dosimeter readings, newest first: date, device, hours in the area and dose. YTD dose adds up this year's.",
      writes: false,
      example: '10062740',
      prepare(input) {
        if (typeof input !== 'string' || !input.trim()) throw new Error('Enter a pernr in quotes, like "10062740".');
        const problem = pernrProblem(input);
        if (problem) throw new Error(problem);
        const pernr = input.trim();
        return { call: client.describe({ name: 'getReadings', pernr }), run: () => client.getReadings(pernr) };
      },
    },
  ];
}
