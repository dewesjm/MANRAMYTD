import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'mr-not-found-page',
  imports: [RouterLink],
  template: `
    <h1 class="text-2xl font-semibold">Page not found</h1>
    <a routerLink="/" class="link mt-2 inline-block">Back to MANRAM YTD</a>
  `,
})
export class NotFoundPage {}
