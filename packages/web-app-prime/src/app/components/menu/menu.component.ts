import { asyncForEach } from '@oas/web-lib-core';

import { Component, OnInit, ChangeDetectorRef, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { AppInstance } from '../../common/appinstance';
import { AppHandler } from '../../common/apphandler';
import { MatMenuTrigger } from '@angular/material/menu';

@Component({
    selector: 'prime-menu',
    templateUrl: './menu.component.html',
    styleUrls: ['./menu.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MenuComponent implements OnInit {
    private static MAX_LEVELS = 4;
    currentSessionId: string;
    contextMenuActiveAppInstance?: AppInstance;
    appInstances: AppInstance[] = [];
    nonPermanentChildrenCount: number = 0;
    contextMenuPositionX: string;
    contextMenuPositionY: string;

    @ViewChild('menuTrigger', { static: true }) contextMenu: MatMenuTrigger;

    constructor (private cd: ChangeDetectorRef) {
        //
    }

    ngOnInit () {
        // Can't use the interface IController unless we use at least one method from it.

        AppHandler.getStream().subscribe(() => {
            this.appInstances = AppHandler.getSortedAppInstances();
            this.nonPermanentChildrenCount = this.appInstances.filter(c => !c.permanent).length;
            this.cd.detectChanges();
        });

        this.contextMenu.menuClosed.subscribe(() => {
            this.contextMenuActiveAppInstance = undefined;
        });

    }

    /**
     * Keep track of commands in ngFor to avoid unnecessary rendering
     *
     * @param {number} _index
     * @param {AppInstance} instance
     * @returns {string}
     * @memberof MenuComponent
     */
    public trackByInstanceId (_index: number, instance: AppInstance): string {
        return instance.id;
    }

    /**
     * Refresh view after changes has been made outside of change detection
     *
     * @memberof MenuComponent
     */
    forceRefreshView () {
        this.cd.detectChanges();
    }

    /**
     * Check if provided app instance exists
     *
     * @param {AppInstance} instance
     * @returns {boolean}
     * @memberof MenuComponent
     */
    appInstanceExists (instance: AppInstance): boolean {
        if (!instance) {
            return false;
        }
        return !!this.appInstances.filter(c => c.id === instance.id);
    }

    /**
     * Set provided app instance as active
     *
     * @param {AppInstance} instance
     * @memberof MenuComponent
     */
    activateAppInstance (instance: AppInstance): void {
        // Since activation of app instances mey be delayed due to promises we make sure it still exists before activating
        if (this.appInstanceExists(instance)) {
            AppHandler.setActiveAppInstance(instance.id, true);
        }
    }

    /**
     *
     *
     * @param {number} level
     * @returns {number}
     * @memberof MenuComponent
     */
    getIndentLevel (level: number): number {
        return Math.min(level, MenuComponent.MAX_LEVELS - 1); // Max levels is 0-index.
    }

    /**
     *
     *
     * @returns
     * @memberof MenuComponent
     */
    getActiveAppInstance () {
        return AppHandler.getActiveAppInstance();
    }

    /**
     *
     *
     * @returns
     * @memberof MenuComponent
     */
    getActiveChildIndex () {
        return this.appInstances.findIndex(c => c.active);
    }

    /**
     *
     *
     * @memberof MenuComponent
     */
    gotoPreviousTab (): void {
        const instances = this.appInstances;
        const activeChildIndex = this.getActiveChildIndex();
        const nextActiveChild = activeChildIndex === 0 ? instances[instances.length - 1] : instances[activeChildIndex - 1];

        this.activateAppInstance(nextActiveChild);
    }

    /**
     *
     *
     * @memberof MenuComponent
     */
    gotoNextTab (): void {
        const children = this.appInstances;
        const activeChildIndex = this.getActiveChildIndex();
        const nextActiveChild = activeChildIndex === children.length - 1 ? children[0] : children[activeChildIndex + 1];

        this.activateAppInstance(nextActiveChild);
    }

    /**
     *
     *
     * @param {AppInstance} instance
     * @memberof MenuComponent
     */
    closeTab (instance: AppInstance | undefined): Promise<any> {
        if (!instance) {
            return Promise.reject();
        }
        return AppHandler.removeAppInstance(instance)
            .then(() => {
                this.forceRefreshView();
            }).catch((error) => {
                console.error(error);
            });
    }

    /**
     *
     *
     * @memberof MenuComponent
     */
    closeCurrentTab (): void {
        const activeInstance = this.getActiveAppInstance();
        if (activeInstance) {
            this.closeTab(activeInstance);
        }
    }

    /**
     *
     *
     * @memberof MenuComponent
     */
    async closeAllTabs (): Promise<any> {
        await asyncForEach(this.appInstances.slice().reverse(), async (instance: AppInstance) => {
            if (!instance.permanent) {
                await this.closeTab(instance);
            }
        });
    }

    /**
     *
     *
     * @param {AppInstance} currentInstance
     * @param {boolean} isStartNode
     * @memberof MenuComponent
     */
    closeChildTabs (currentInstance: AppInstance | undefined, isStartNode: boolean): void {
        if (!currentInstance) {
            return;
        }
        // Close chilren recursivly
        if (currentInstance.children) {
            currentInstance.children.forEach(child => this.closeChildTabs(child, false));
        }
        // Remove child unless it's the node we start on
        if (!isStartNode) {
            this.closeTab(currentInstance);
        }
    }

    /**
     *
     *
     * @param {AppInstance} currentInstance
     * @memberof MenuComponent
     */
    closeOtherTabs (currentInstance: AppInstance | undefined): void {
        if (!currentInstance) {
            return;
        }

        this.appInstances.forEach((instance) => {
            if (currentInstance.id !== instance.id) {
                this.closeTab(instance);
            }
        });
    }

    /**
     *
     *
     * @param {MouseEvent} $event
     * @param {AppInstance} instance
     * @returns
     * @memberof MenuComponent
     */
    showContextMenu ($event: MouseEvent, instance: AppInstance) {
        // Don't show context menu if Ctrl is pushed when we click.
        // This is so we can inspect elements in the menu
        if ($event.ctrlKey) {
            return;
        }
        this.contextMenuActiveAppInstance = instance;
        this.contextMenuPositionX = $event.pageX + 'px';
        this.contextMenuPositionY = $event.pageY + 'px';
        // Wait for mouse position to be set
        this.contextMenu.openMenu();
        $event.stopImmediatePropagation();
        return false;
    }

    /**
     * Called when user clicks on the tab's close button we
     *
     * @param {Event} $event
     * @param {AppInstance} instance
     * @memberof MenuComponent
     */
    $closeTab ($event: Event, instance: AppInstance) {
        // Don't bubble up since this would cause the click to activate the child we're removing
        $event.preventDefault();
        $event.stopPropagation();

        this.closeTab(instance);
    }
}
