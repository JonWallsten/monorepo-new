import { Component } from '@angular/core';
import { TestService } from '../../shared-services/test.service';
import { TestStaticService } from '../../shared-services/test.static.service';
import { isString } from '@oas/web-lib-core';
@Component({
    selector: 'start',
    templateUrl: './start.component.html',
    styleUrls: ['./start.component.scss']
})
export class StartComponent {
    user: string;

    constructor (private testService: TestService) {
        this.user = 'Sven';

        if (!isString(this.user)) {
            throw new Error('Testing import from core');
        }
        // Test a few services
        this.testService.doSomething();
        TestStaticService.doSomething();

    }
}
