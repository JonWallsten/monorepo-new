(function () {
    'use strict';
    angular.module('web-app-doc')
        .controller('ExampleAppJsController', ['AppInfo', function controller(AppInfo) {
            console.log(AppInfo); // eslint-disable-line no-console
        }]);
})();
