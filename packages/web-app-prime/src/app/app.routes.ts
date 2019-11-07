import { Routes } from '@angular/router';
import { DefaultComponent } from './components/default/default.component';
import { MainComponent } from './components/main/main.component';


export const appRoutes: Routes = [
    { path: 'tab/:id', component: MainComponent },
    { path: 'openapp', component: DefaultComponent }
];
