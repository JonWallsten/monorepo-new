import { isString } from '@oas/web-lib-core';

export class ExampleAppTsController {

    constructor (public $scope: ng.IScope, public $window, public $timeout, private AppInfo) {
        'ngInject';
    }

    $onInit () {
        if (isString(this.AppInfo)) {
            throw new Error('Should not be possible');
        }
    }
}
