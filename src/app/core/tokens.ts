import { InjectionToken } from '@angular/core';
import {
  LocalPreferencesRepository,
  PersonaRepository,
  PreferencesRepository,
  SampleDoseClient,
  SeedPersonaRepository,
  DoseClient,
} from '../../data';

/*
 * The seams to storage and the dose data. Each defaults to the mockup's version; the real app
 * provides its own in app.config.ts and the screens don't change.
 */

export const PREFERENCES_REPOSITORY = new InjectionToken<PreferencesRepository>(
  'PreferencesRepository',
  { providedIn: 'root', factory: () => new LocalPreferencesRepository() },
);

export const PERSONA_REPOSITORY = new InjectionToken<PersonaRepository>('PersonaRepository', {
  providedIn: 'root',
  factory: () => new SeedPersonaRepository(),
});

/** The dose data: the sample data built into the app. */
export const DOSE_CLIENT = new InjectionToken<DoseClient>('DoseClient', {
  providedIn: 'root',
  factory: () => new SampleDoseClient(),
});
