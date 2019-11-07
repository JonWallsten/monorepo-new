import { Component, HostListener } from '@angular/core';
import { AppHandler } from '../../common/apphandler';

@Component({
    selector: 'prime-header',
    templateUrl: './header.component.html',
    styleUrls: ['./header.component.scss']
})
export class HeaderComponent {
    expanded: boolean = false;

    @HostListener('document:click', ['$event'])
    documentClick (event: MouseEvent) {
        if (!(event.target as HTMLElement).closest('.prime-menu') && !(event.target as HTMLElement).closest('.svg-inline--fa')) {
            this.closeExpandedMenu();
        }
    }

    /**** Where used ****/
    openEdit () {
        this.openApp({
            id: 'edit'
        });
        this.closeExpandedMenu();
    }

    /**** Where used ****/
    openExampleAppTsWui () {
        this.openApp({
            id: 'wui-example-ts'
        });
        this.closeExpandedMenu();
    }

    /**** Knockdown ****/
    openExampleAppJsWui () {
        this.openApp({
            id: 'wui-example-js'
        });
        this.closeExpandedMenu();
    }
    /**** HELP ****/
    openExampleAppTsDoc () {
        this.openApp({
            id: 'doc-example-ts'
        });
        this.closeExpandedMenu();
    }

    /**** Structures affected by a CO ****/
    openExampleAppJsDoc () {
        this.openApp({
            id: 'doc-example-js'
        });
        this.closeExpandedMenu();
    }

    /**** Where used in condition ****/
    openExampleAppTsStr () {
        this.openApp({
            id: 'str-example-ts'
        });
        this.closeExpandedMenu();
    }

    openExampleAppJsStr () {
        this.openApp({
            id: 'str-example-js'
        });
        this.closeExpandedMenu();
    }

    openApp (options: any) {
        AppHandler.open(options);
        this.closeExpandedMenu();
    }

    toggleMenu () {
        this.expanded = !this.expanded;
    }

    closeExpandedMenu () {
        this.expanded = false;
    }
}
