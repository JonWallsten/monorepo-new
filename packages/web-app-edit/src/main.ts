import 'zone.js/dist/zone';
import 'normalize.css/normalize';

import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';
import { enableProdMode, ApplicationRef } from '@angular/core';
import { enableDebugTools } from '@angular/platform-browser';

if (environment.production) {
    enableProdMode();
}

platformBrowserDynamic().bootstrapModule(AppModule, { ngZoneEventCoalescing: true })
    .then(module => {
        if (!environment.production) {
            const applicationRef = module.injector.get(ApplicationRef);
            const appComponent = applicationRef.components[0];
            enableDebugTools(appComponent);
        }
    })
    .catch(err => console.error(err));
