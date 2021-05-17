// eslint-disable-next-line @typescript-eslint/no-require-imports
require('./example-js.less');
// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
const { isString } = require('@oas/web-lib-core');

(function () {
    'use strict';

    angular.module('exampleModule')
        .directive('exampleDirectiveJs', function () {
            return {
                restrict: 'E',
                // eslint-disable-next-line @typescript-eslint/no-require-imports
                template: require('./example-js.template.html'),
                scope: {
                    input: '@'
                },
                link: ['$scope', function ($scope) {
                    if (!isString($scope.input)) {
                        console.log('scope.input is not a string'); // eslint-disable-line no-console
                    }
                }]
            };
        });
})();
