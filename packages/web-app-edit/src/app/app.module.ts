import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { FontAwesomeModule, FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { faSearch, faTimes, faBars, faCog } from '@fortawesome/free-solid-svg-icons';

import { appRoutes } from './app.routes';
import { AppComponent } from './app.component';

import { WebLibAngularModule, DialogService, MaterialDesignModule } from '@oas/web-lib-angular';
import { HttpClientModule } from '@angular/common/http';
import { StartComponent } from './components/start/start.component';

@NgModule({
    imports: [
        RouterModule.forRoot(appRoutes, {
            enableTracing: false,
            useHash: true
        }),
        FormsModule,
        ReactiveFormsModule,
        BrowserAnimationsModule,
        BrowserModule,
        FontAwesomeModule,
        HttpClientModule,
        WebLibAngularModule,
        MaterialDesignModule
    ],
    declarations: [
        AppComponent,
        StartComponent
    ],
    providers: [
        DialogService
    ],
    bootstrap: [AppComponent]
})
export class AppModule {
    constructor (library: FaIconLibrary) {
        library.addIcons(faCog);
        library.addIcons(faSearch);
        library.addIcons(faTimes);
        library.addIcons(faBars);
    }
}
