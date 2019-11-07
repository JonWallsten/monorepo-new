import { AppInstance, AppInstanceOptions } from './appinstance';

import {
    forEach,
    isDefined,
    isArray,
    isObject,
    queryParamsAsObject,
    extend,
    uniqueId,
    AppInfo
} from '@oas/web-lib-core';
import axios from 'axios';
import { Router, NavigationExtras } from '@angular/router';
import { Subject } from 'rxjs';
import { NgZone } from '@angular/core';

export type OasAppEntry = {
    id: string;             // Unique identifier
    comment?: string;       // A way to add a note to the appentries.json file. Not used for other purpose
    metaUri?: string;       // The connection to /oaswui/contextfunction/instance/XXX and /oaswui/contextfunction/type/XXX
    name: string;
    description?: Record<string, string>; // A description for standAlone apps in the Application Library
    modal?: boolean;                // TODO: Refactor to remove
    availability?: Array<string>;   // TODO: Refactor to remove
    externalUrl?: string;           // TODO: remove, use metadata instead (MMT1-24331)
    externalUrlProd?: string;       // TODO: remove, use metadata instead (MMT1-24331)
    systemFeatures?: Array<string>; // All systemFeatures that the user must have to access the app
    category: number;
    url: string;            // URI template
    standAlone?: object | null;    // Object with default fill parameters for URL-template or null for special standAlone applications (My work and App library)
};

export type AppInstances = {
    [index: string]: AppInstance;
};

export type AppEntriesResponse = {
    app: anyTODO;
    response: anyTODO;
};

export type Session = {
    id: string;
    appInstances: AppInstance[];
    modified: string;
    created: string;
    name: string;
    note: string;
};

export type AppHandlerEvent = 'created' | 'removed' | 'modified' | 'refresh';

export class AppHandlerClass {
    private static _instance: AppHandlerClass;
    private appInstances: AppInstances = {};
    private router: Router;
    private zone: NgZone;
    private appEntries: OasAppEntry[] = [];
    private cachedStandAloneApps: undefined | any;
    private apps: Record<string, any> = {};
    public static primeSessionsStorageKey: string = 'primeSessions';
    public recoveredSessionId: string;
    private subject = new Subject<AppHandlerEvent>();

    private constructor () {


        const urlParameters = queryParamsAsObject();

        // Check for a sessionId in the URL
        this.recoveredSessionId = (location.href.match(/[\&\?]sessionId=([^\&]+)/) || [])[1];

        // Loop through every URL parameter
        forEach(urlParameters, (paramValue, paramKey) => {
            let regExpMatches;

            // Check if the parameter starts with test-app-<applicationName>
            // Use the information provided to override the base URL in every environment for that app
            if ((regExpMatches = /^test-app-([a-z]+)/.exec(paramKey))) { // tslint:disable-line:no-conditional-assignment
                const appName = regExpMatches[1] as string;

                if (this.apps[appName]) {
                    console.warn('OasPrime: URL parameter', paramKey, 'used to set app', appName, 'base URL to', paramValue, this.apps);

                    // Currently, we don't know which environment we're running in at this moment,
                    // loop through every environment and update every URL to the supplied one
                    forEach(this.apps[appName].url, (_environmentUrl, environmentKey) => {
                        this.apps[appName].url[environmentKey] = paramValue;
                    });
                } else {
                    console.error('OasPrime: URL parameter', paramKey, 'references unknown app', appName);
                }
            }
        });
    }

    public static getInstance () {
        if (!AppHandlerClass._instance) {
            AppHandlerClass._instance = new AppHandlerClass();
        }

        return AppHandlerClass._instance;
    }

    /**
     * Return the stream for setting up subscribtions
     *
     * @returns
     * @memberof InteractionService
     */
    public getStream () {
        return this.subject.asObservable();
    }

    private fetchAppEntries = function (app): Promise<AppEntriesResponse> {
        return new Promise((resolve, _reject) => {
            const url = this.getAppUrl(app) + '/appentries.json';

            console.debug('InitAppService.init: Getting appentries for ' + app, url);

            const requestParams: any = {
                headers: {
                    Accept: 'application/json'
                },
                timeout: 5000
            };
            requestParams.withCredentials = !url.match(/^(http:\/\/|https:\/\/|:?\/+)+(localhost|127\.0\.0\.1)|^\/[a-z]+|^(?!http)[a-z]+/igm);

            axios.get(url, requestParams)
                .then(function (response) {
                    if (typeof response.data !== 'object') {
                        console.error('[fetchAppEntries] format error in ' + url);
                    }
                    resolve({ app, response });
                })
                .catch(function (response) {
                    resolve({ app, response });
                });
        });
    };

    loadAppEntries (): Promise<any> {
        /**
         * Get appEntries from all applications
         */
        return Promise.all([
            // TODO: Refactor to use available app keys instead of hardcoded values
            this.fetchAppEntries('wui'),
            this.fetchAppEntries('structure'),
            this.fetchAppEntries('doc'),
            this.fetchAppEntries('edit')
        ]).then((appEntries) => {

            forEach(appEntries, (appEntry) => {
                this.registerAppEntry(appEntry);
            });

            return this.expandAppEntries();
        });
    }

    setApps (apps) {
        this.apps = apps;
    }

    /**
     * Since AppHandler is Angular agnostic and don't have injection we need to inject a state handler to be able to modify the state
     *
     * @param {ng.ui.IStateService} $state
     * @memberof AppHandlerClass
     */
    attachToAngular (router: Router, zone: NgZone) {
        this.router = router;
        this.zone = zone;
    }

    /**
     * Applications
     */
    getAppEntries () {
        return this.appEntries;
    }

    getAppUrl (app: string) {
        return this.apps && this.apps[app] && this.apps[app].url && this.apps[app].url[AppInfo.environment];
    }

    getSideBarAppInstance (): AppInstance {
        const sidebarAppInstances = Object.keys(this.appInstances).map(key => this.appInstances[key]).filter(instance => instance.sidebar);
        if (sidebarAppInstances.length > 1) {
            throw new Error('[AppHandler].getSideBarAppInstance(): Only one sidebar app instance is supported');
        }
        return sidebarAppInstances[0];
    }

    getListOfAppInstances (includeSidebar?: boolean): AppInstance[] {
        // Remove any sidebar applications
        return Object.keys(this.appInstances).map(key => this.appInstances[key]).filter(instance => !instance.sidebar || includeSidebar);
    }

    getRecipients () {
        return this.getListOfAppInstances(true).filter(c => c.window).map(c => c.window);
    }

    getSortedAppInstances (): AppInstance[] {
        // Root items is all AppInstances wihtout a parent. E.g. My work, application lib, apps opened from the menu e.t.c.
        const rootItems = this.getListOfAppInstances()
            .filter(item => !item.parent)
            .sort((a, b) => a.created - b.created); // Sort by the birth of the app instance instead of relying on object key order
        // The app instance collection (this._appInstances) is a flat structure ordered by when they where pushed.
        // All items also stores references to it's children nodes in an array.
        // So to render the correct order we create a new array where we "flattern" the virtual hierarki into a new flat structure.
        const flat = (collection: AppInstance[], item: AppInstance) => {
            // Add level so that we can use it for calculating indentation
            item.level = item.parent ? item.parent.level + 1 : 0;
            collection.push(item);
            if (Array.isArray(item.children)) {
                item.children.reduce(flat, collection);
            }
            return collection;
        };

        // Begin with the root items and recursively add items to the new array.
        return rootItems.reduce(flat, []);
    }

    /**
     * Return the first root app instance
     *
     * @returns {AppInstance} Return the first app instance
     * @memberof Prime
     */
    getRootAppInstance (): AppInstance | undefined {
        const key = Object.keys(this.appInstances)[0];
        return this.appInstances[key];
    }

    getFirstAppInstance (): AppInstance | undefined {
        return this.getListOfAppInstances().filter(c => c.level === 0 && !c.permanent)[0];
    }

    getAppInstance (instanceId: string): AppInstance | undefined {
        return this.appInstances[instanceId];
    }

    getActiveAppInstance (): AppInstance | undefined {
        let activeIntance: AppInstance | undefined;

        forEach(this.appInstances, function (instance) {
            if (instance.active) {
                activeIntance = instance;
            }
        }, this);

        return activeIntance;
    }

    setActiveAppInstance (newActiveInstanceId: string, gotoState?: boolean): void {

        if (!newActiveInstanceId) {
            throw new Error('[Prime->setActiveAppInstance] You have to specify a app instance ID');
        }

        const newActiveInstance = this.getAppInstance(newActiveInstanceId);

        if (!newActiveInstance) {
            console.warn('[Prime->setActiveAppInstance] Instance cannot be found');
            return;
        }

        forEach(this.appInstances, (instance) => {
            instance.active = instance.id === newActiveInstanceId;
        });


        if (gotoState) {
            // Change state and the $stateChangeSuccess in the root controller will set the child to active if it exists
            this.navigate(['/tab', newActiveInstanceId]);
        }

        this.appInstanceModified();
    }

    /**
     * Find the previous sibling for a specific instance.
     * Note: This is needed when we're killing app instances and focus should be on the previous sibling.
     *
     * @param {AppInstance} instance Instance to find sibling for.
     * @returns {(AppInstance | undefined)} The previous sibling if found
     */
    getPreviousRootSiblingInstance (instance: AppInstance): AppInstance | undefined {
        const instances = this.getSortedAppInstances();
        const rootInstances = instances.filter(c => c.level === 0 && !c.permanent);
        const currentInstanceIndex = rootInstances.findIndex(c => c.id === instance.id);

        return currentInstanceIndex !== -1 ? rootInstances[currentInstanceIndex - 1] : undefined;
    }

    /**
     * Opens the corresponding application from an url. The url is parsed to get hold of necessary parameters used by the app.
     *
     * A url might consist of several url:s like this
     * (openapp?url=oasprime:/application/vieweco?type=eco&instance=49000,openapp?url=oasprime:/application/vieweco?type=eco&instance=500000)
     * The url is then divided in several url:s and this function is called recursively for each url
     *
     * @param url {string} Url for application
     * @returns {Promise<any>}
     */
    openAppFromUrl (url: string): AppInstance | undefined {

        if (!url) {
            throw new Error('[AppHandler.openApp]: url is undefined');
        }

        //url might be encoded
        url = decodeURIComponent(url);

        //if url contains openapp extract app url from the original url...
        if (url.indexOf('openapp?url=') > -1) {
            url = url.substring(url.indexOf('openapp?url=') + 12, url.length);
        }

        //split url if it consists of several app urls.. call this function recursively with each url.
        if (url.indexOf('url=') > -1 && url.match(/url=/g)!.length > 0) {
            const splittedUrls = url.split('&url=');
            if (splittedUrls) {
                splittedUrls.forEach((splittedUrl => {
                    this.openAppFromUrl(splittedUrl);
                }));
            }
        }

        const parameters = this.extractParametersFromUrl(url);
        const metaUri = this.getMetaUriFromUrl(url);
        let appentry: OasAppEntry | undefined;
        if (metaUri) {
            appentry = this.getAppentry(metaUri);
        }

        // Either app doesn't exists or they are not loaded yet.
        if (!appentry) {
            throw new Error(`[AppHandler] openAppFromUrl() Either app doesn't exists or they are not loaded yet. MetaURI: ${metaUri}`);
        }

        return this.open({
            id: appentry.id,
            title: appentry.name,
            object: parameters
        });
    }

    /**
     * Gets the metaUri for the Application from a url
     * Supported urls are:
     * .../#/metaUri?parameters.....
     * or
     * url=metaUri?parameters.....
     *
     * @param url
     * @return {string}
     */
    private getMetaUriFromUrl (url): string {
        if (url.indexOf('url=') > -1) {
            return url.substring(url.indexOf('url=') + 4, url.indexOf('?'));
        } else if (url.indexOf('#/') > -1 && url.indexOf('?') > -1) {
            return url.substring(url.indexOf('#/') + 2, url.indexOf('?'));
        } else if (url.indexOf('#/') < 0 && url.indexOf('?') < 0) {
            return url;
        } else if (url.indexOf('#/') < 0 && url.indexOf('?') > -1) {
            return url.substring(0, url.indexOf('?'));
        }
        return '';
    }

    /**
     * Get an appentry from the appentries declared in appentries.json
     * @param metaUri meta uri to look for
     * @return {any}
     */
    private getAppentry (metaUri: string): OasAppEntry | undefined {

        if (metaUri) {
            const appEntries = AppHandler.getAppEntries();
            for (let i = 0; i < appEntries.length; i++) {
                if (appEntries[i].metaUri === metaUri) {
                    return appEntries[i];
                }
            }
        }
        return;
    }

    /**
     * Extracts the paramters from an url.
     * @param url {string}
     * @return {{}} object contining the extracted parameters
     */
    private extractParametersFromUrl (url: string): object {

        if (url.indexOf('?') < 0) {
            return {};
        }

        const parameterString = url.substring(url.indexOf('?') + 1, url.length);
        const returnObject = {};
        if (parameterString) {
            const splittedString = parameterString.split('&');
            if (splittedString) {
                splittedString.forEach((splitted => {
                    const keyValue = splitted.split('=');
                    returnObject[keyValue[0]] = keyValue[1];
                }));
            }
        }
        return returnObject;
    }

    /**
     * Open something in OasPrime
     */
    open (openOptions: any, originAppInstanceWindowId?: string): AppInstance | undefined { // TODO: consistent promise return
        const appInstanceOptions: AppInstanceOptions = extend({}, openOptions);

        // TODO: transform/check OasPrimeOpenOptions -> AppInstanceOptions
        // OasPrimeOpenOptions.id -> AppInstanceOptions.entryId, AppInstanceOptions.id refers to the AppInstance id
        delete appInstanceOptions.id;
        appInstanceOptions.entryId = openOptions.id;

        // Save a reference to an optional parent for hierarchy purposes.
        // Avoid setting the parent when the parent is special (currently App lib or My work)
        if (originAppInstanceWindowId && this.appInstances[originAppInstanceWindowId] && !this.appInstances[originAppInstanceWindowId].special) {
            appInstanceOptions.parent = this.appInstances[originAppInstanceWindowId];
        }

        if (appInstanceOptions.url && !appInstanceOptions.entryId) {
            // Static
            //console.warn('OasPrime.open:parent: static url', childOptions);
            return this.createAppInstance(appInstanceOptions);
        } else if (openOptions.id || openOptions.entry) {
            // Dynamic
            //console.warn('OasPrime.open:parent: rel', childOptions);
            const openInstance = this.alreadyOpen(openOptions.id);
            if (openOptions.id && openInstance) {
                //console.warn('OasPrime.open:parent: alreadyOpen', openOptions.rel);
                this.setActiveAppInstance(openInstance.id);
                return openInstance;
            } else {
                let entry = openOptions.entry;

                if (!entry) {
                    const primeEntries: any = this.getPrimeEntries(false, undefined);
                    if (!openOptions.id) {
                        throw new Error('[AppHandler].open(): Id is missing for entry');
                    }
                    entry = primeEntries[openOptions.id];

                    if (!entry) {
                        console.error(`[AppHandler].open(): id ${openOptions.id} missing in primeEntries`, primeEntries);
                        throw new Error(`[AppHandler].open(): Unable to find application to open for id ${openOptions.id}`);
                        // TODO: better error handling and abort/reject promise
                    }
                } else {
                    // Rel is extended onto childOptions when we don'' have an entry
                    appInstanceOptions.entryId = entry.id;
                }

                const paramenters = extend({}, entry.standAlone || {}, openOptions.object || {});

                appInstanceOptions.url = appInstanceOptions.url || (entry.link && entry.link.fillTemplate(paramenters)) || '';
                appInstanceOptions.title = appInstanceOptions.title || entry.tabTitle;
                appInstanceOptions.category = entry.category;
                appInstanceOptions.special = entry.standAlone === null;
                appInstanceOptions.sidebar = openOptions.sidebar;

                console.debug('[AppHandler].open():', appInstanceOptions.title, appInstanceOptions.url);

                return this.createAppInstance(appInstanceOptions);
            }
        }

        console.error('[AppHandler].open(): id or url required', appInstanceOptions);
        return;
    }

    /**
     * Create a new app instance (Open app)
     *
     * @param {AppInstanceOptions} options Options for opening the app.
     * @returns {AppInstance}
     */
    createAppInstance (options: AppInstanceOptions): AppInstance | undefined {

        const instance = new AppInstance(options);

        this.appInstances[instance.id] = instance;

        // Add the child to the parent's children array to make it easier to traverse when rendering the tabs.
        if (instance.parent) {
            instance.parent.children.push(this.appInstances[instance.id]);
        }

        // Initial child should be active from the start
        if (instance.initial) {
            instance.active = true;
        }

        if (!this.router) {
            throw new Error('[AppHandler] $state is mandatory to allow routing. Please use setState($state).');
        }

        // Add a promise that will be resolved by the API when the app is alive
        instance.promise = new Promise((resolve, reject) => {
            // Allow for the API to resolve this by exposing resolve/reject
            instance.defer = {
                resolve,
                reject
            };
        });

        // When the promise is resolved the app is no longer loading
        instance.promise.finally(() => {
            instance.loading = false;
            // Make sure any listeners knows loading is done.
            this.appInstanceModified();
        });

        // Activate the child unless it's loaded in the background
        if (!options.background && !options.sidebar) {
            this.navigate(['/tab', instance.id]);
            // Deactivate current instance
            const currentActiveAppIntance = this.getActiveAppInstance();
            if (currentActiveAppIntance) {
                currentActiveAppIntance.active = false;
            }

            // Activate new instance
            instance.active = true;
        }

        // Since this subject will be listened to by Angular components we need to trigger then in the zone.
        this.zone.run(() => {
            // Let the instances know that one of them was killed.
            this.subject.next('created');
        });

        return instance;
    }

    /**
     * Remove provided app instance (Close tab)
     *
     * @param {(string | AppInstance)} instance The instance to remove. The id as a string of the instance object.
     * @returns {Promise<any>}
     */
    removeAppInstance (instanceOrId: string | AppInstance): Promise<any> {
        const instance = typeof instanceOrId === 'string' ? this.getAppInstance(instanceOrId) : instanceOrId;
        if (!instance) {
            return Promise.reject('Cannot find instance');
        }
        // Remember current tab so we can switch back to it once the app instance about to be removed is gone.
        const currentActiveAppIntance = this.getActiveAppInstance();

        return Promise.resolve()
            .then(async () => {
                // Permanent children cannot be removed
                if (instance.permanent) {
                    return Promise.reject('Permanent app instances cannot be removed');
                }

                // Set child as no longer active
                instance.active = false;

                // Set focus to currentActivetab or if no tab currently has focus we need to figure out which one to focus next.
                // First we try the child's parent.
                // If it doesn't have a parent we try it's previous sibling.
                // If it has none we take first available app tab.
                // If there are no tabs besides My work (permanent) we set focus to that.
                let nextActiveInstance = currentActiveAppIntance && currentActiveAppIntance !== instance ? currentActiveAppIntance : undefined;
                nextActiveInstance = nextActiveInstance || instance.parent || this.getPreviousRootSiblingInstance(instance);

                // Tell OasPrime to remove a child and wait for the promise to resolve to be sure that the child has been prepared for the removal (facilitating garbage collection) and then removed
                await this.removeAppInstanceInternal(instance.id);
                // We can't check for firstAppTab until the our tab is actually deleted or it might return the tab about to be deleted.
                nextActiveInstance = nextActiveInstance || this.getFirstAppInstance() || this.getRootAppInstance();
                // If the child we removed was not active we just re-activate current active child.
                if (nextActiveInstance) {
                    this.setActiveAppInstance(nextActiveInstance.id);
                }
                return;
            });
    }

    /**
     * Remove all open app instances
     *
     * @returns {Promise<any>}
     */
    removeAppIntances (): Promise<any> {
        const actions: Promise<any>[] = [];
        this.getListOfAppInstances().forEach((instance) => {
            // Don't try to remove permanent insatnces
            if (!instance.permanent) {
                actions.push(this.removeAppInstance(instance));
            }
        });

        return Promise.all(actions);
    }

    private removeAppInstanceInternal (instanceId: string): Promise<any> {
        const instance = this.appInstances[instanceId]; // The current child/tab
        if (instance instanceof AppInstance) { // Check if the tab/child referenced by childId currently exists
            // Send a "destroy"-command to the child so it can begin cleaning it self up (by triggering $rootScope.$destroy) to facilitate effective garbage collection
            return Promise.resolve()
                .then(() => {
                    // We must wait until we have an acknowledged destroy operation before rewiring and deleting the child
                    const children = instance.children;
                    const parent = instance.parent;

                    // If the tab has it's own children they have to be adopted by the child's parent
                    // We also remove the child from it's parent collection of children at the same time.
                    if (parent && children.length > 0) {
                        parent.children = [
                            // Spread the older siblings
                            ...parent.children.slice(0, parent.children.indexOf(instance)),
                            // The grandchildren takes it's parent's place
                            ...children.map(c => {
                                c.level--; // Decrease one level since we're moving up in the tree.
                                c.parent = parent; // Grandparent is now parent for the children.
                                return c;
                            }),
                            // Spread the newer siblings
                            ...parent.children.slice(parent.children.indexOf(instance) + 1) // We add 1 to get rid of the child
                        ];
                    } else if (!parent && children.length > 0) {
                        // If the tab has it's own children, but no parent, the children will take the place of the tab/child to be removed
                        // Make the children orphans
                        instance.children = children.map(c => {
                            c.level = 0; // Set level to 0 since we always are at the root level when there's no parent
                            c.parent = undefined; // Parent is now undefined
                            c.created = instance.created; // Change the birthdate of the children to avoid too much jitter in the tab listing
                            return c;
                        });

                    } else if (parent) { // If the child doesn't have children we just remove it from it's parent's collection of children.
                        parent.children = parent.children.filter(c => c.id !== instance.id);
                    }

                    // Reset instance to remove any active reference that would keep the instance from being garbage collected
                    instance.reset();

                    delete this.appInstances[instance.id];

                    // Since this subject will be listened to by Angular components we need to trigger then in the zone.
                    this.zone.run(() => {
                        this.subject.next('removed');
                    });
                });

        } else {
            console.warn('OasPrime.removeChild: childId', instanceId, 'do not exist');
        }

        return Promise.resolve();
    }

    /*
     *   ToDo: temporary check if my work or application library has active session (not optimal)
     */
    alreadyOpen (entryId?: string): AppInstance | undefined {
        // Quick fix to avoid refactoring other logic, TODO: argument entryId should be required
        if (!entryId) {
            return undefined;
        }

        let openInstance: AppInstance | undefined;
        forEach(this.appInstances, (instance: AppInstance) => {
            if (instance.entryId === entryId && entryId === 'applicationlibrary') {

                if (!this.router) {
                    throw new Error('[AppHandler].alreadyOpen(): Router is missing');
                }

                this.navigate(['/tab', instance.id]);

                openInstance = instance;
            }
        });

        return openInstance;
    }


    registerAppEntry (data) {

        const appName = data.app;
        const entries = data.response && data.response.data && data.response.data.entries;

        if (entries) {
            Object.keys(entries).forEach((entryName) => {
                const entry: OasAppEntry = entries[entryName];
                // entry.app = appName;
                delete entry.comment;
                if (entry.url) {
                    // Insert the correct path to make the url complete
                    entry.url = this.apps[appName].url[AppInfo.environment] + entry.url;
                }
                // Verify some aspects of an appentry to log some errors for the worst misconfigurations
                if ((entry.standAlone || entry.modal) && !entry.description) {
                    console.error('[AppHandler].registerAppEntry(): description must be specified for standAlone apps', entry);
                }
                if (!entry.name) {
                    console.error('[AppHandler].registerAppEntry(): name must be specfied for all apps', entry);
                }
                if ((entry.standAlone === undefined && !entry.modal) && (entry.description)) {
                    console.error('[AppHandler].registerAppEntry(): description not used for applications that can\'t run standAlone', entry);
                    delete entry.description;
                    delete entry.name;
                }
                if (!entry.id || !entry.category) {
                    console.error('[AppHandler].registerAppEntry(): A required property is missing (id, category)', entry);
                }
                if ((entry as any).rel) {
                    console.error('[AppHandler].registerAppEntry(): The property "rel" is replaced with "id"', entry);
                }
                if (entry.modal === true) {
                    if (entry.url) {
                        console.error('[AppHandler].registerAppEntry(): url must not be specified when modal:true is set', entry);
                    }
                } else {
                    if (!entry.url) {
                        console.error('[AppHandler].registerAppEntry(): url is missing and modal is missing or false. Either url or modal can be used', entry);
                    }
                }

                if (this.appEntries.some((appEntry) => appEntry.id === entry.id)) {
                    const errorMessage = `[AppHandler].registerAppEntry(): id "${entry.id}" already exists, must be unique`;
                    console.error(errorMessage, entry);
                    throw new Error(errorMessage);
                }

                this.appEntries.push(entry);
            }, this);
        }
    }

    expandAppEntries () {
        return Promise.all(
            this.appEntries
                .filter((entry) => {
                    return isDefined(entry.id);
                })
                .map((entry) => {
                    return Promise.resolve(entry);
                }))
            .then(() => {
                return this.appEntries;
            })
            .catch((error: string) => {
                console.error(`[Apphandler] Could not expand app entries. Error: ${error}`);
            });

    }

    /**
     * Get available Prime entry points
     * @param onlyStandaloneApps
     * @param filterWithMetadataLinks
     */
    getPrimeEntries (onlyStandaloneApps: boolean, filterWithMetadataLinks?: Record<string, Readonly<any>>): Record<string, any> {
        if (onlyStandaloneApps && filterWithMetadataLinks) {
            console.error('[Apphandler].getPrimeEntries():', onlyStandaloneApps, filterWithMetadataLinks);
            throw new Error('[AppHandler].getPrimeEntries(): onlyStandaloneApps and filterWithMetadataLinks cannot be true at the same time');
        }

        // Return a cached result if exists
        if (onlyStandaloneApps && this.cachedStandAloneApps) {
            return this.cachedStandAloneApps;
        }

        const primeEntries: any = {};
        let primeEntry: any;

        forEach(this.appEntries, (appEntry: OasAppEntry) => {
            const matchingMetadataLinks: Readonly<any>[] = [];

            // Check if the app can run standalone (i.e. without a provided object/startobject)
            const appCanRunStandalone = isObject(appEntry.standAlone);

            // Check if no systemFeature is required
            const noRequiredSystemFeature = !isArray(appEntry.systemFeatures);

            // Check the user's systemFeatures against any specified required systemFeatures
            const userHasSystemFeature = true;

            // Filter the entries according to links found on a type (e.g. /oaswui/contextfunction/type) or an instance (e.g. /oaswui/contextfunction/instance)
            if (filterWithMetadataLinks) {
                Object.keys(filterWithMetadataLinks).forEach(link => {
                    if (filterWithMetadataLinks[link].href === appEntry.metaUri) {
                        matchingMetadataLinks.push(filterWithMetadataLinks[link]);
                    }
                });
            }

            // Only add applications that fulfill the requirements
            if ((!onlyStandaloneApps || (onlyStandaloneApps && appCanRunStandalone)) &&
                (userHasSystemFeature || noRequiredSystemFeature) &&
                (!filterWithMetadataLinks || (filterWithMetadataLinks && matchingMetadataLinks.length > 0))) {

                // Iterate over every matching link or once with no sourceLink when !filterWithMetadataLinks
                (matchingMetadataLinks.length > 0 ? matchingMetadataLinks : [null]).forEach((sourceLink: null | any) => {
                    primeEntry = {
                        id: appEntry.id,
                        availability: appEntry.availability ? appEntry.availability : [],
                        modal: appEntry.modal ? appEntry.modal : false,
                        // Append any appEntry title requiring the 'development' systemFeature with an indication that this is limited to developers
                        title: (sourceLink ? sourceLink.title.getPrimitiveValue('langUi').toString() : appEntry.name) + ((appEntry.systemFeatures && appEntry.systemFeatures.some(systemFeature => systemFeature === 'development')) ? ' [Dev]' : ''),
                        tabTitle: appEntry.name,
                        description: appEntry.description && appEntry.description.en, // TODO: use the language of the user instead of hardcoded en
                        category: appEntry.category,
                        externalUrl: appEntry.externalUrl,
                        externalUrlProd: appEntry.externalUrlProd,
                        metaUri: appEntry.metaUri,
                        sourceLink: sourceLink,
                        standAlone: appEntry.standAlone
                    };

                    // Configuration or logic error if we already have a previous entry for the id
                    if (isDefined(primeEntries[appEntry.id])) {
                        console.error(`[AppHandler].getPrimeEntries(): duplicate entry for id ${appEntry.id}, must be unique`, appEntry, primeEntries[appEntry.id]);
                        throw new Error(`[AppHandler].getPrimeEntries(): duplicate entry for id ${appEntry.id}`);
                    }

                    primeEntries[sourceLink ? sourceLink.rel : appEntry.id] = primeEntry;
                });
            }
        }, this);

        if (onlyStandaloneApps) {
            // Cache the result
            this.cachedStandAloneApps = primeEntries;
        } else if (filterWithMetadataLinks) {
            // Add links to external applications, i.e. links with linkParameters.target set to something
            Object.keys(filterWithMetadataLinks).forEach(link => {
                const sourceLink = filterWithMetadataLinks[link];
                if (sourceLink.linkParameters.target) {
                    primeEntry = {
                        id: sourceLink.rel,
                        availability: [],
                        modal: false,
                        title: sourceLink.title.getPrimitiveValue('langUi').toString(),
                        tabTitle: 'N/A',
                        description: '',
                        sourceLink
                    };

                    primeEntries[sourceLink.rel] = primeEntry;

                }
            });
        }

        return primeEntries;
    }

    /**
     * Send notice to anyone listening that we have modified an app instance
     *
     * @memberof AppHandlerClass
     */
    appInstanceModified () {
        // Since this subject will be listened to by Angular components we need to trigger then in the zone.
        this.zone.run(() => {
            this.subject.next('modified');
        });
    }

    /**
     * Generate a unique ID for each app instance
     *
     * @returns
     * @memberof AppHandlerClass
     */
    uniqueId () {
        return 'prime' + uniqueId();
    }

    /**
     * Naviagte to provided route
     *
     * @param {any[]} commands
     * @param {NavigationExtras} [extras]
     * @memberof AppHandlerClass
     */
    navigate (commands: any[], extras: NavigationExtras = {}) {
        // Preserve queryparmans when switching/opening apps
        if (!extras.queryParamsHandling) {
            extras.queryParamsHandling = 'preserve';
        }

        // Run in zone since AppHandler is outside of angular
        this.zone.run(() => {
            this.router.navigate(commands, extras);
        });
    }
}

export const AppHandler = AppHandlerClass.getInstance();
