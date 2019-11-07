import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { FontAwesomeModule, FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { faSearch, faTimes, faBars, faCog } from '@fortawesome/free-solid-svg-icons';

import { appRoutes } from './app.routes';
import { AppComponent } from './app.component';

import { WebLibAngularModule, DialogService } from '@oas/web-lib-angular';
import { HttpClientModule } from '@angular/common/http';
import { DefaultComponent } from './components/default/default.component';
import { MenuComponent } from './components/menu/menu.component';
import { MainComponent } from './components/main/main.component';
import { HeaderComponent } from './components/header/header.component';

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
        WebLibAngularModule
    ],
    declarations: [
        AppComponent,
        MainComponent,
        DefaultComponent,
        MenuComponent,
        HeaderComponent
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
