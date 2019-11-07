require('./example-js.less');
const { isString } = require('@oas/web-lib-core');

(function () {
    'use strict';

    angular.module('exampleModule')
        .directive('exampleDirectiveJs', function () {
        return {
            restrict: 'E',
            template: require('./example-js.template.html'),
            scope: {
                input: '@'
            },
            link: function (scope) {
                if(!isString(scope.input)) {
                    console.log('scope.input is not a string'); // eslint-disable-line no-console
                }
            }
        };
    });

})();
