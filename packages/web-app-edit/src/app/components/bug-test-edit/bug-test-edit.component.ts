import { Component, ChangeDetectorRef } from '@angular/core';
import { BugTestComponent } from '@oas/web-lib-angular';
import { api, api2 } from '@oas/web-lib-core';
import axios from 'axios';

@Component({
    selector: 'bug-test-edit',
    templateUrl: './bug-test-edit.component.html',
    styleUrls: ['./bug-test-edit.component.scss']
})
export class BugTestEditComponent extends BugTestComponent {
    constructor (protected override cd: ChangeDetectorRef) {
        super(cd);
        console.log(api());
        console.log(api2());
        console.log(axios.VERSION);
    }


    override ngOnInit () {
        // Call inherited method
        this.test();

        this.cd.markForCheck();
    }
}
