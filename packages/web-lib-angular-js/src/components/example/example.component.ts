import { ExampleController } from './example.controller';
import exampleTemplate from './example.template.html';

export const ExampleComponent: ng.IComponentOptions = {
    controller: ExampleController,
    template: exampleTemplate,
    bindings: {
        data: '@',
        onExampleChange: '&'
    }
};
