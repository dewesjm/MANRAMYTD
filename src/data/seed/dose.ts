import { DoseBook } from '../../domain';
import { parseDoseBook } from '../parse';
import seed from './dose-seed.json';

/*
 * The sample dose data: ZORD's people (same ids as MWQ, Deckfoot and ZORD) with departments,
 * pernrs, reporting lines, dose profiles and dosimeter readings. Made by
 * scripts/make-sample-data.cjs; dated as of SAMPLE_AS_OF.
 */

/** The day the sample data was made for. YTD counts readings from 1 January of this year to this day. */
export const SAMPLE_AS_OF: string = seed.asOf;

/** A fresh copy of the sample store each call, so nothing can change the seed itself. */
export function seedDoseBook(): DoseBook {
  return parseDoseBook(seed);
}
