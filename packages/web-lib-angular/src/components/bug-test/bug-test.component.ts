import { Component, ChangeDetectorRef } from '@angular/core';

@Component({
    selector: 'bug-test',
    templateUrl: './bug-test.component.html',
    styleUrls: ['./bug-test.component.scss']
})
export class BugTestComponent {
    constructor (protected cd: ChangeDetectorRef) {}

    ngOnInit () {
        this.cd.markForCheck();
    }

    test () {
        //tslint:disable-next-line
        console.log('Inherited method called');
    }
}
