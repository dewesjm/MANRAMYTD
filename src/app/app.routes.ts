import { Routes } from '@angular/router';
import { SearchPage } from './features/search/search-page';

export const routes: Routes = [
  { path: '', title: 'MANRAM YTD', component: SearchPage },
  {
    path: 'admin',
    loadChildren: () => import('./features/admin/admin.routes').then((m) => m.ADMIN_ROUTES),
  },
  {
    path: 'changelog',
    title: 'Change Log · MANRAM YTD',
    loadComponent: () =>
      import('./features/changelog/changelog-page').then((m) => m.ChangelogPage),
  },
  {
    path: '**',
    title: 'Page not found · MANRAM YTD',
    loadComponent: () =>
      import('./features/not-found/not-found-page').then((m) => m.NotFoundPage),
  },
];
