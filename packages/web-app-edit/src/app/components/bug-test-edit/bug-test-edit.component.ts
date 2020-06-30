import { Component, ChangeDetectorRef } from '@angular/core';
import { BugTestComponent } from '@oas/web-lib-angular';

@Component({
    selector: 'bug-test-edit',
    templateUrl: './bug-test-edit.component.html',
    styleUrls: ['./bug-test-edit.component.scss']
})
export class BugTestEditComponent extends BugTestComponent {
    constructor (protected cd: ChangeDetectorRef) {
        super(cd);
    }

    ngOnInit () {
        // Call inherited method
        this.test();

        this.cd.markForCheck();
    }
}
