import { ExampleDirective } from './example/example.directive';

export class Directives {
    static register (module) {
        module.directive('exampleDirective', ExampleDirective.create);
    }
}
