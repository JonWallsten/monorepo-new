/*
 * All rights, including copyright, in this source code
 */

/**
 * @ngdoc module
 * @name exampleModule
 * @description
 * The `exampleModule` module provides an interface to OAS.
 *
 */
import * as angular from 'angular';
import { Components } from './components/components';
import { Directives } from './directives/directives';


import './css/_bootstrap-variables.less';
import './css/_bootstrap.less';
import './css/fonts.less';
import './css/angular.less';
import './css/icons.less';
import './css/ui.less';
import './css/ui2.less';
import './css/variables.less';
import { exampleFilter } from './filters/example.filter';
import { Configure } from './configure';
import { AppInfoFactory } from '@oas/web-lib-core';

angular.module('exampleModule', [
    'ng',
    'ngMessages',
    'ngSanitize',
    'ui.router',
    'ui.bootstrap',
    'ui.ace',
    'pascalprecht.translate',
    'ui.select'
])
/**
 * @ngdoc object
 * @name ExampleBaseConstants
 *
 * @description
 * constant values.
 *
 * @property {string} version       Current version of oasBase.
 *
 */
    .constant('ExampleBaseConstants', {
        version: '1.0.0'
    })
    .value('ExampleEventEmitter', {}) // A simple way to get access to the eventEmitter pattern wrapper in AngularJs
    .config(function ($uibTooltipProvider) {
        /**
         * Decorator for $exceptionHandler
         */
        Configure.uiTooltipProvider($uibTooltipProvider);
    })
    .run(function ($q, $window) {
        /**
         * Configurations for postal.js used in OasMessageBus
         */
        if (angular.isUndefined($window.postal)) {
            throw new Error('OasMessageBus: postal.js needs to be loaded');
        }

        $window.postal.configuration.promise = {};

        $window.postal.configuration.promise.createDeferred = function () {
            return new $q.defer(); // eslint-disable-line new-cap
        };

        $window.postal.configuration.promise.getPromise = function (deferred) {
            return deferred.promise;
        };

        $window.postal.configuration.promise.fail = 'reject';
        $window.postal.configuration.promise.fulfill = 'resolve';

        $window.postal.addWireTap(function (_data, envelope) {
            if (envelope.channel !== 'postal') {
                // Enable debug log for messages sent with OasMessageBus (example: from/to OasPrime)
                // oasLog.debug('OasMessageBus wireTap', envelope.channel, envelope.topic, _data);
            }
        });
    })
    .filter('maxCharacters', exampleFilter)
    .filter('safeHtml', ['$sce', ($sce: ng.ISCEService) => {
        return (val: string) => {
            return $sce.trustAsHtml(val);
        };
    }])

    /**
     * Factories
     */
    // TODO: Most of OasClass* will probably no longer be needed to be accessed through an Angular factory (use imports and remove them here)
    .factory('AppInfo', AppInfoFactory);


// Register directives
Directives.register(angular.module('exampleModule'));

// Register components
Components.register(angular.module('exampleModule'));
