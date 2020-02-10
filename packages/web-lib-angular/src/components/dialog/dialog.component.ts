import { Component, ViewChild, Inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { DialogData, DialogButtonOptions } from '../../services/dialog.service';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButton } from '@angular/material/button';

@Component({
    selector: 'dialog-component',
    templateUrl: './dialog.component.html',
    styleUrls: ['./dialog.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DialogComponent {
    primaryButtonElement: HTMLButtonElement;
    busy: boolean;
    inDevelopment: boolean;
    @ViewChild('primaryButton', { static: false }) set content (button: MatButton) {
        if (button) {
            this.primaryButtonElement = button._elementRef.nativeElement;
        }
    }

    constructor (private dialogRef: MatDialogRef<DialogComponent, Function>,
                 @Inject(MAT_DIALOG_DATA) public data: DialogData,
                 private cd: ChangeDetectorRef
    ) {

        this.dialogRef.afterOpened().subscribe(() => {
            if (this.primaryButtonElement) {
                this.primaryButtonElement.focus();
            }
        });

    }

    closeDialog (buttonOptions?: DialogButtonOptions) {
        if (this.dialogRef) {
            // If the DialogButtonOptions has a promise set, resolve it before closing the dialog
            if (buttonOptions?.promise) {
                this.busy = true;

                buttonOptions.promise()
                    .then(() => {
                        // Close the dialog
                        this.dialogRef.close(buttonOptions.callback);
                    })
                    .catch(() => {
                        // Keep the dialog open since the promise failed
                        console.debug('[DialogComponent].closeDialog(): promise failed, keep the dialog open');
                    })
                    .finally(() => {
                        this.busy = false;
                        this.cd.markForCheck();
                    });

            } else {
                // Close immediately
                this.dialogRef.close(buttonOptions?.callback);
            }
        }
    }
}
