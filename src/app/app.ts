import { Component } from '@angular/core';
import { AppShell } from './shared/app-shell/app-shell';

@Component({
  selector: 'mr-root',
  imports: [AppShell],
  template: '<mr-app-shell />',
})
export class App {}
