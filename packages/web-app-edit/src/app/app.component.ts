/**
 * Angular 2 decorators and services
 */
import { Component, ViewEncapsulation, ChangeDetectionStrategy, AfterViewInit } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { IdleProcessor, DialogService } from '@oas/web-lib-angular';
import { AppInfoClass, AppInfo } from '@oas/web-lib-core';

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
export class AppComponent implements AfterViewInit {
    public readonly appInfo: AppInfoClass;
    public readonly isMSIE: boolean;

    constructor (
        private matIconRegistry: MatIconRegistry,
        private domSanitizer: DomSanitizer,
        private dialogService: DialogService
    ) {
        this.appInfo = AppInfo;

        // Check if user is running Internet Explorer.
        this.isMSIE = !!window.navigator.userAgent.match(/(MSIE|Trident)/);

        this.matIconRegistry.addSvgIcon('error-rounded', this.domSanitizer.bypassSecurityTrustResourceUrl('assets/icons/error-rounded.svg'));
        this.matIconRegistry.addSvgIcon('warning-rounded', this.domSanitizer.bypassSecurityTrustResourceUrl('assets/icons/warning-rounded.svg'));
        this.matIconRegistry.addSvgIcon('info-rounded', this.domSanitizer.bypassSecurityTrustResourceUrl('assets/icons/info-rounded.svg'));
        this.matIconRegistry.addSvgIcon('bug-rounded', this.domSanitizer.bypassSecurityTrustResourceUrl('assets/icons/bug-rounded.svg'));
    }

    ngAfterViewInit () {
        if (this.isMSIE) {
            // Wait with showing the dialog until everything seems to be rendered
            IdleProcessor.requestLowPriorityTask(() => {
                this.dialogService.addNonRecoverableDialog('Unsupported browser', 'Your browser is unfortunately unsupported. Please use Chrome instead.');
            });
        }
    }
}
