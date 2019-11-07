import { isDefined, uniqueId } from '@oas/web-lib-core';

export type AppInstanceOptions = {
    id?: string;            // TODO: why should id be provided as an option?
    title: string;          // The title of the child
    changeLog?: boolean;
    category?: number;      // Tab category for app categorisation
    url: string;            // A current url for the content in the child
    type?: number;          // The type of the child (iframe, popup, etc)
    mode?: number;          // The mode of the child (normal, focus, etc)
    entryId?: string;        // Identifier for corresponding appEntry/primeEntry
    parent?: AppInstance;
    special?: boolean;      // A special standAlone application (My work and App library)
    sidebar?: boolean;      // If the app should be opened in the sidebar
    permanent?: boolean;    // A permanent child cannot be closed/removed
    initial?: boolean;      // Opened when Prime is loaded
    background?: boolean;   // Load tab in background
};

export class AppInstance {
    private _url: string; // A current url for the content in the child
    public id: string;
    public active: boolean; // Only one active child per group
    public entryId: string; // Identifier for corresponding appEntry/primeEntry
    public title: string; // The title of the child
    public changeLog?: boolean;
    public menuFormDefinition: string; // The menuFormDefinition of the child
    public subtitle: string; // The title of the child
    public subtitleComplement: string; // Complement for the subtitle
    public category: number = 0; // Category for app categorisation
    public created: number;
    public window: Window; // A reference to the Window
    public type: number = 0; // The type of the child (iframe, popup, etc)
    public mode: number = 0; // The mode of the child (normal, focus, etc)
    public showSidebar?: boolean; // Show the focus/preview window for this normal child
    public defer: any; // Promise resolved when the child is initialized
    public promise: Promise<AppInstance>; // Promise resolved when the child is initialized
    public iframeEl?: HTMLIFrameElement;
    public parent?: AppInstance; // Reference to the parent
    public children: AppInstance[] = [];
    public level: number = 0;
    public modified: boolean;
    public permanent?: boolean; // Cannot be closed in the Prime menu.
    public initial?: boolean; // Opened when Prime is loaded.
    public special?: boolean; // Indicate that this is a special child (App library, My work) that needs other stuff than a normal child
    public sidebar?: boolean; // Indicates that the app is loading
    public loading: boolean = true; // Indicates that the app is loading
    public background: boolean; // Load app in background
    public beforeCloseCallbackActivated: boolean;

    constructor (options: AppInstanceOptions) {

        this.created = Date.now();

        if (typeof options.id === 'string') {
            this.id = options.id;
        } else {
            this.id = 'prime' + uniqueId();
        }

        if (isDefined(options.entryId)) {
            this.entryId = options.entryId || '';
        }

        if (isDefined(options.category)) {
            this.category = options.category || 0;
        }

        if (isDefined(options.url)) {
            this.url = options.url;
        }

        if (isDefined(options.title)) {
            this.title = options.title;
        }

        if (isDefined(options.changeLog)) {
            this.changeLog = options.changeLog;
        }

        if (isDefined(options.parent)) {
            this.parent = options.parent;
        }

        if (isDefined(options.special)) {
            this.special = options.special;
        }

        if (isDefined(options.permanent)) {
            this.permanent = options.permanent;
        }

        if (isDefined(options.initial)) {
            this.initial = options.initial;
        }

        if (isDefined(options.sidebar)) {
            this.sidebar = options.sidebar;
        }
    }

    /**
     * Reset all references to avoid memory leaks in iframe
     *
     * @memberof AppInstance
     */
    reset () {
        (this.parent as any) = undefined;
        (this.children as any) = undefined;
        (this.iframeEl as any) = undefined;
        (this.defer) = undefined;
        (this.promise as any) = undefined;
        (this.window as any) = undefined;
    }

    /**
     * Use setter
     *
     * @memberof AppInstance
     */
    get url () {
        return this._url;
    }

    /**
     * Ta make sure the url always has the correct attributes we use a setter
     *
     * @memberof AppInstance
     */
    set url (url: string) {
        this._url = url;
        // If it's an iframe
        if (this.type === 0) {
            // Make sure ID hasn't been applied already
            if (!this._url.match(/&uiId=prime[0-9]{1,5}/)) {
                this._url += (this._url && this._url.indexOf('?') === -1 ? '?' : '&') + 'ui=child&uiId=' + this.id;
            }
        }
    }

    toJSON () {
        // Remove ui and uiId params since these will have to be replaced when revived
        const cleanUrl = this.url
                        .replace(/([\&|\?])ui=[a-z]+\&?/gi, '$1')
                        .replace(/([\&|\?])uiId=prime[0-9]+\&?/, '$1')
                        .replace(/([\&|\?])submit=true\&?/, '$1')
                        .replace(/\&$/, '');

        // const urlHasType = cleanUrl.match(/[\&\?]type=[^\&]+/);

        // TODO: not necessary to serialize all of this, should sync with whats needed from StoredAppInstance on load
        return {
            id: this.id,
            active: this.active,
            entryId: this.entryId,
            url: cleanUrl,
            title: this.title,
            changeLog: this.changeLog,
            menuFormDefinition: this.menuFormDefinition,
            parentId: this.parent ? this.parent.id : null,
            children: this.children,
            initial: this.initial
            //type: urlHasType && cleanUrl.replace(/^.*[\&\?]type=([^\&]+).*$/, '$1')
        };
    }
}
