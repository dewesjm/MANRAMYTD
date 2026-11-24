import { Injectable, inject } from '@angular/core';
import { DoseService } from './dose-service';
import { PersonasService } from './personas-service';
import { PreferencesService } from './preferences-service';

/** Loads the app's data at start: preferences, View as people and the departments. */
@Injectable({ providedIn: 'root' })
export class DemoDataService {
  private readonly preferences = inject(PreferencesService);
  private readonly personas = inject(PersonasService);
  private readonly dose = inject(DoseService);

  async load(): Promise<void> {
    await Promise.all([this.preferences.load(), this.personas.load(), this.dose.load()]);
  }
}
