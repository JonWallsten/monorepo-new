import { isString, eventEmitter } from '@oas/web-lib-core';

export class ExampleController implements ng.IComponentController {
    data: string;
    onExampleChange;

    constructor () {
        'ngInject';

    }

    $onInit () {
        // Called on each controller after all the controllers on an element have been constructed and had their bindings initialized.
        console.log('ExampleComponent $onInit', this.data); // tslint:disable-line no-console

        if (!isString(this.data)) {
            console.log('Data is not a string.'); // tslint:disable-line no-console
        }
    }

    $onChanges (changes) {
        // Called whenever one-way bindings (<) are updated.
        // Example for the binding 'data'
        console.log('ExampleComponent $onChanges', changes.data.currentValue, changes.data.previousValue); // tslint:disable-line no-console
    }

    newExample (newExample) {
        console.log('ExampleComponent newExample', newExample); // tslint:disable-line no-console

        // Trigger the event/callback on the output binding onExampleChange
        this.onExampleChange(eventEmitter({
            newExample: newExample
        }));
    }
}
