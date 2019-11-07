import exampleAppJsTemplate from './example-app-js.template.html';

export const ExampleAppJsState: ng.ui.IState = {
    url: '/example-js',
    template: exampleAppJsTemplate,
    controller: 'ExampleAppJsController as ctrl',
    data: {}
};
