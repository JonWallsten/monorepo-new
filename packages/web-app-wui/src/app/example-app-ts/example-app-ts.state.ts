import exampleAppTsTemplate from './example-app-ts.template.html';
import { ExampleAppTsController } from './example-app-ts.controller';

export const ExampleAppTsState: ng.ui.IState = {
    url: '/example',
    template: exampleAppTsTemplate,
    controller: ExampleAppTsController,
    controllerAs: '$ctrl',
    data: {}
};
