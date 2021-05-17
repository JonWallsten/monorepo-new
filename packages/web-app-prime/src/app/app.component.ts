/**
 * Angular 2 decorators and services
 */
import { Component, ViewEncapsulation, NgZone, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { IdleProcessor } from '@oas/web-lib-angular';
import { AppInfoClass, AppInfo } from '@oas/web-lib-core';
import { AppHandler } from './common/apphandler';
import { Router } from '@angular/router';

/**
 * App Component
 * Top Level Component
 */
@Component({
    selector: 'app',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    encapsulation: ViewEncapsulation.None, // Make the styles of this component global,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent {
    public appInfo: AppInfoClass;

    constructor (private zone: NgZone, private router: Router, private cd: ChangeDetectorRef) {
        this.appInfo = AppInfo;

        // Inject our Angular zone into the idle processor class to make sure change detection works smoothly
        IdleProcessor.injectZone(this.zone);
        AppInfo.environment = 'localhost';
        AppHandler.setApps({
            wui: { // web-app-wui
                url: {
                    localhost: 'http://localhost:3010' // Default value - do no commit changes to this line
                }
            },
            doc: { // web-app-doc
                url: {
                    localhost: 'http://localhost:3030' // Default value - do no commit changes to this line
                }
            },
            structure: { // web-app-structure
                url: {
                    localhost: 'http://localhost:3080' // Default value - do no commit changes to this line
                }
            },
            edit: {
                url: {
                    localhost: 'http://localhost:3060' // Default value - do no commit changes to this line
                }
            }
        });

        AppHandler.loadAppEntries()
            .then(() => {

                // Provide a state for the angular agnostic AppHandler so it can open apps
                AppHandler.attachToAngular(this.router, this.zone);

                // Open initial tab
                const appInstance = AppHandler.open({
                    id: 'edit'
                });

                appInstance!.promise.then(() => {
                    console.log('this.showSessionRestoreToast()'); // eslint-disable-line no-console
                });

                if (!appInstance) {
                    return;
                }

                this.cd.detectChanges();

            })
            .catch((error) => {
                console.error('[AppComponent] Could not load appEntries', error);
                this.cd.detectChanges();
            });
    }
}
