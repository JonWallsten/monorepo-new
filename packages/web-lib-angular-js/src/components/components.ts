import { ExampleComponent } from './example/example.component';
/**
 * Only components that fully follow best practices, naming convention, hierarchy, implementation, etc should be here
 */
export class Components {
    static register (module) {
        /**
         * Example component
         */
        module.component('exampleComponent', ExampleComponent);
    }
}
