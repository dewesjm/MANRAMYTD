/*
 * Checks that data read from the sample file or (later) a service has the right shape, turning
 * it into domain types. A record in the wrong shape is dropped, not guessed at: the app's job is
 * to show dose data as it is. Plain hand-written checks, like the other apps.
 */
import { Department, DoseBook, DoseProfile, Person, Reading } from '../domain';
import { isObject } from './schema';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const isString = (v: unknown): v is string => typeof v === 'string';
const isNumber = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const isDate = (v: unknown): v is string => isString(v) && ISO_DATE.test(v);
const isStringOrNull = (v: unknown): v is string | null => v === null || isString(v);

/** True when `v` is an object whose listed fields pass their checks. */
function has(v: unknown, checks: Record<string, (x: unknown) => boolean>): v is Record<string, unknown> {
  return isObject(v) && Object.entries(checks).every(([key, check]) => check(v[key]));
}

/** Copies just the listed fields, so extra fields in the data never reach the screens. */
function pick<T>(v: Record<string, unknown>, keys: readonly (keyof T & string)[]): T {
  return Object.fromEntries(keys.map((k) => [k, v[k]])) as T;
}

export function parseDepartment(v: unknown): Department | null {
  return has(v, { code: isString, name: isString }) ? pick<Department>(v, ['code', 'name']) : null;
}

export function parsePerson(v: unknown): Person | null {
  const checks = {
    pernr: isString, id: isString, firstName: isString, lastName: isString, title: isString, department: isString,
    supervisor1: isStringOrNull, supervisor2: isStringOrNull,
  };
  return has(v, checks)
    ? pick<Person>(v, ['pernr', 'id', 'firstName', 'lastName', 'title', 'department', 'supervisor1', 'supervisor2'])
    : null;
}

export function parseDoseProfile(v: unknown): DoseProfile | null {
  const checks = { pernr: isString, controlLevel: isNumber, medDate: isDate, trainingDate: isDate };
  return has(v, checks) ? pick<DoseProfile>(v, ['pernr', 'controlLevel', 'medDate', 'trainingDate']) : null;
}

export function parseReading(v: unknown): Reading | null {
  const checks = { pernr: isString, date: isDate, deviceId: isString, hours: isNumber, dose: isNumber };
  return has(v, checks) ? pick<Reading>(v, ['pernr', 'date', 'deviceId', 'hours', 'dose']) : null;
}

function list<T>(v: unknown, parse: (x: unknown) => T | null): T[] {
  return Array.isArray(v) ? v.map(parse).filter((x): x is T => x !== null) : [];
}

/** The whole store from one JSON object with a list per kind (the sample file's shape). */
export function parseDoseBook(v: unknown): DoseBook {
  const data = isObject(v) ? v : {};
  return {
    departments: list(data['departments'], parseDepartment),
    people: list(data['people'], parsePerson),
    profiles: list(data['profiles'], parseDoseProfile),
    readings: list(data['readings'], parseReading),
  };
}
