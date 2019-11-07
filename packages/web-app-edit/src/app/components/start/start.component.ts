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
    public test: string;
    public test2: string;

    constructor (private testService: TestService) {
        // Test a few services
        this.test = this.testService.test();
        if (!isString(this.test)) {
            throw new Error('Angular service does not work');
        }
        this.test2 = TestStaticService.test();
        if (!isString(this.test2)) {
            throw new Error('Static service does not work');
        }

    }
}
