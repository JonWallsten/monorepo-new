import { Component, ChangeDetectionStrategy, Input } from '@angular/core';

@Component({
    selector: 'debug',
    templateUrl: './debug.component.html',
    styleUrls: ['./debug.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush

})
export class DebugComponent {
    @Input() hideStyling: boolean;
    public debug: boolean;

    constructor () {
        //
    }
}
