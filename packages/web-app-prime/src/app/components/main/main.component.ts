import { OnInit, Component, ChangeDetectorRef } from '@angular/core';
import { AppHandler } from '../../common/apphandler';
import { AppInstance } from '../../common/appinstance';

@Component({
    selector: 'main-component',
    templateUrl: './main.component.html',
    styleUrls: ['./main.component.scss']
})
export class MainComponent implements OnInit {
    public appInstances: AppInstance[];
    public activeAppInstance: AppInstance;
    public sidebarAppInstance: AppInstance;

    constructor (private cd: ChangeDetectorRef) {
    }

    ngOnInit () {
        /**
         * Register a listener that activates a child according to the current state/route
         */

        AppHandler.getStream().subscribe(this.getAppData);

        this.getAppData();
    }

    /**
     * Get the latest app instance data
     *
     * @memberof MainComponent
     */
    getAppData = () => {
        this.appInstances = AppHandler.getListOfAppInstances();
        this.activeAppInstance = AppHandler.getActiveAppInstance()!;
        this.sidebarAppInstance = AppHandler.getSideBarAppInstance();
        this.cd.detectChanges();
    }

    /**
     * Keep track of commands in ngFor to avoid unnecessary rendering
     *
     * @param {number} _index
     * @param {AppInstance} instance
     * @returns {string}
     * @memberof MainComponent
     */
    public trackByAppInstanceId (_index: number, instance: AppInstance): string {
        return instance.id;
    }
}
