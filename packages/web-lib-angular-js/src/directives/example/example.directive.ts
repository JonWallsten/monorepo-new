import template from './example.template.html';
import { isString } from '@oas/web-lib-core';

export class ExampleDirective implements ng.IDirective {
    restrict = 'E';
    template = template;
    scope = {
        input: '@'
    };

    constructor () {
        'ngInject';
    }

    link (scope) {
        if (!isString(scope.input)) {
            console.log('Input is not a string.'); // tslint:disable-line no-console
        }
    }

    static create (): ExampleDirective {
        return new ExampleDirective();
    }
}
