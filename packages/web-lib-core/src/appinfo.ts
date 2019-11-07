type appEnvironments = 'localhost' | 'test' | 'dev' | 'stage' | 'prod' | 'edu' | 'node';

export type OasServer = {
    description: string;
    id: string;
    name: string;
    oasEnvironmentId: number;
    restApiBasic: string;
    restApiSpnego: string;
};

export type AppInfoVersions = {
    build?: string;
    buildDate?: Date;
    buildDateFormatted?: string;
    angular?: string;
    oasBase?: string;
};

export class AppInfoClass {
    private static _instance: AppInfoClass;
    public id: string; // Prime child id
    public name: string; // Programmatic identifier for app, used for localStorage, etc
    public displayName: string; // DisplayName for app
    public title: string; // Title for Prime tab and HTML head title
    public subtitle: string; // Subtitle for Prime tab
    public heading: string; // Legacy, used for display AngularJs heading ("subtitle")
    public menuFormDefinition: string;
    public isPrime: boolean; // Parent app
    public isChild: boolean; // Child app
    public isStandalone: boolean; // Standalone app, i.e. accessed directly and not as a child to Prime
    public isNode: boolean; // NodeJs app, i.e. a script (e.g. integration tests) running in a terminal
    public initialized: boolean | null; // Null when init is in progress, neither success nor failure yet
    public initializedError?: string; // Init failed with this humanly readable reason
    public initializedErrorStatus?: number; // Init failed with this HTTP status
    public environment: appEnvironments;
    public environmentId?: number; // Query string uiEnvId // TODO: refactor, no need for both environmentId and oasEnvironmentId
    public oasEnvironmentId: number; // The real OAS environment id for the currently selected backend
    public host: OasServer | undefined; // Frontend-server (i.e. host of the JavaScript/HTML/images/etc for the web app)
    public currentServer: OasServer | undefined; // Current OAS backend server
    public servers: OasServer[]; // List of possible OAS backends
    public isProdBuild: boolean; // Webpack production build
    public timeInitStart: number; // Used to determine app init time
    public timeInitStop: number; // Used to determine app init time
    public minimal: boolean; // Legacy, read a query string parameter (ui=minimal) to show a minimal UI for embedding
    public versions: AppInfoVersions;
    public changeLog: boolean;

    /**
     * Singleton
     *
     * @static
     * @returns
     * @memberof AppInfoClass
     */
    public static getInstance (): AppInfoClass {
        if (!AppInfoClass._instance) {
            AppInfoClass._instance = new AppInfoClass();
        }

        return AppInfoClass._instance;
    }

    public initiate (initialInfo: Partial<AppInfoClass>) {
        // Set computed default values for all apps
        this.isStandalone = !initialInfo.isPrime && !initialInfo.isChild;

        // Allow for initial settings to be set in a chunk
        Object.keys(initialInfo).forEach((key) => {
            this[key] = initialInfo[key];
        });
    }

    /**
     * Returns true if we should freeze immutable objects
     * TODO: We could add a setting to turn this on/off for test environments if we want to
     */
    public get freezeImmutableObjects (): boolean {
        if (this.oasEnvironmentId === 99 || this.oasEnvironmentId === 16) {
            // In prod and staging we skip the freeze since it takes time to perform
            // and it should have been tested in the other environments so even though we leave
            // the objects unlocked  no one should change them
            return false;
        }
        return true;
    }
}

// Export instance
export const AppInfo = AppInfoClass.getInstance();

// For Angular provider
export function AppInfoFactory () {
    return AppInfo;
}
