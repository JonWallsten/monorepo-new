import * as angular from 'angular';

import { RootState } from './root.state';
import { ExampleAppTsState } from './example-app-ts/example-app-ts.state';
import { ExampleAppJsState } from './example-app-js/example-app-js.state';
import { UiController } from './ui/ui.controller';

export class OasAppInitiator {
    private static moduleName: string = 'web-app-doc';
    private module: ng.IModule;

    constructor () {
        // Set up module
        this.module = angular.module(OasAppInitiator.moduleName, ['ngMessages', 'ui.router', 'ui.bootstrap', 'exampleModule', 'ngFileUpload', 'diff-match-patch']);

        this.configureAngular();
        this.setStates();
        this.module.controller('UiController', UiController);

    }

    configureAngular () {
        this.module.config(($logProvider) => {
            // Enable/disable calls to $log.debug
            $logProvider.debugEnabled(false);
        })
        .config(($compileProvider) => {
            // false: ~10-20% performance increase on views with a lot of bindings
            // true: required for Chrome plugin ng-inspector
            $compileProvider.debugInfoEnabled(false);
        });
    }

    setStates () {
        this.module.config(($stateProvider, $urlRouterProvider) => {
            // Any unmatched url
            $urlRouterProvider.otherwise('/');
            $stateProvider
                .state('root', RootState)
                .state('example-app-ts', ExampleAppTsState)
                .state('example-app-js', ExampleAppJsState);
        });
    }
}
