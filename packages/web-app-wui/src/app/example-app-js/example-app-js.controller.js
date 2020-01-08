(function () {
    'use strict';
    angular.module('web-app-wui')
        .controller('ExampleAppJsController', ['AppInfo', function controller(AppInfo) {
            console.log(AppInfo); // eslint-disable-line no-console
        }]);
})();
