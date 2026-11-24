import { DoseRow } from '../../../domain';
import { GridColumn } from '../../shared/data-grid/data-grid';

/** Like Nov 16, 2026, or empty. Dates are local calendar days, so no time zone shifts them. */
export function formatDate(iso: string | null): string {
  if (!iso) return '';
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/** A dose in mrem with up to one decimal (212.5), or empty. */
export function formatDose(mrem: number | null): string {
  return mrem === null ? '' : mrem.toLocaleString('en-US', { maximumFractionDigits: 1 });
}

/** The results grid, in the order the user listed. Doses in mrem. */
export const DOSE_COLUMNS: readonly GridColumn<DoseRow>[] = [
  { id: 'supervisor2', header: 'Supervisor level 2', value: (r) => r.supervisor2 },
  { id: 'supervisor1', header: 'Supervisor level 1', value: (r) => r.supervisor1 },
  { id: 'name', header: 'Name', value: (r) => r.name },
  { id: 'department', header: 'Department', value: (r) => r.department, text: (r) => `${r.department} ${r.departmentName}`.trim() },
  { id: 'pernr', header: 'Pernr', value: (r) => r.pernr },
  { id: 'ytdDose', header: 'YTD Dose (mrem)', value: (r) => r.ytdDose, text: (r) => formatDose(r.ytdDose), numeric: true },
  { id: 'controlLevel', header: 'CNT Level (mrem)', value: (r) => r.controlLevel, text: (r) => formatDose(r.controlLevel), numeric: true },
  { id: 'allowable', header: 'Allowable (mrem)', value: (r) => r.allowable, text: (r) => formatDose(r.allowable), numeric: true },
  { id: 'medDate', header: 'Med Date', value: (r) => r.medDate, text: (r) => formatDate(r.medDate) },
  { id: 'trainingDate', header: 'Training Date', value: (r) => r.trainingDate, text: (r) => formatDate(r.trainingDate) },
];
