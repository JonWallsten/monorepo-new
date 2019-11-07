import './main.less';
import './external.less';


import { IStateService } from 'angular-ui-router';

export class UiController implements ng.IController {
    public appInfo: any;

    constructor (private AppInfo, public $state: IStateService) { // tslint:disable-line no-shadowed-variable
        'ngInject';
    }

    $onInit () {

        this.appInfo = this.AppInfo;
    }
}
