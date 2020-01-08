import { Injectable } from '@angular/core';
import { MatDialogRef, MatDialogConfig, MatDialog } from '@angular/material/dialog';
import { DialogComponent } from '../components/dialog/dialog.component';

export type DialogEvents = 'addDialog' | 'addSimpleDialog' | 'addNonRecoverableDialog' | 'closeDialog';

export type DialogStream = {
    type: DialogEvents;
    options?: DialogOptions;
};

type DialogQueueItem = {
    data: DialogData;
    settings?: Partial<MatDialogConfig>;
};

export type DialogButtonOptions = {
    text: string;
    callback?: Function;
    promise?: () => Promise<any>;
};

export type DialogOptions = {
    title: string;
    content?: string; // TODO: Remove(?) attribute content since it's only a shortcut for one message (messages = [content])
    developerMessages?: string[]; // Optional messages content only shown to developers
    messages?: string[];
    primaryButton?: DialogButtonOptions;
    secondaryButton?: DialogButtonOptions;
    tertiaryButton?: DialogButtonOptions;
    actionRequired?: boolean;
    nonRecoverable?: boolean;
    forceDisplay?: boolean;
    useHtml?: boolean;
};

export type DialogData = {
    title: string;
    messages: string[]; // Ordinary messages
    developerMessages?: string[]; // Optional debug messages only shown to developers
    primaryButton?: DialogButtonOptions;
    secondaryButton?: DialogButtonOptions;
    tertiaryButton?: DialogButtonOptions;
    useHtml?: boolean;
};

@Injectable()
export class DialogService {
    private dialog: MatDialogRef<DialogComponent, Function> | undefined;
    private dialogQueue: DialogQueueItem[] = [];
    private dialogBaseSettings: MatDialogConfig = {
        autoFocus: false,
        restoreFocus: true,
        closeOnNavigation: false
    };
    private afterCloseCallback: Function;

    constructor (private matDialog: MatDialog) {

    }

    /**
     * Add a plain dialog
     *
     * @param {string} title
     * @param {string} content
     * @memberof DialogService
     */
    addSimpleDialog (title: string, content: string) {
        return this.addDialog({
            title,
            content,
            primaryButton:{
                text: 'Close'
            }
        });
    }

    /**
     * Add a plain non recoverable dialog
     *
     * @param {string} title
     * @param {string} content
     * @memberof DialogService
     */
    addNonRecoverableDialog (title: string, content: string, button?: DialogButtonOptions, developerMessages?: string[]) {
        return this.addDialog({
            title,
            content,
            developerMessages,
            actionRequired: true,
            primaryButton: button
        });
    }

    /**
     * Add a new dialog and then show it if another dialog isn't open already
     *
     * @param {DialogOptions} options
     * @returns
     * @memberof DialogService
     */
    addDialog (options: DialogOptions): MatDialogRef<DialogComponent> | undefined {
        if (!options) {
            throw new Error('[dialog] No options provided for dialog.');
        }

        // Populate model
        const data: DialogData = {
            title: options.title,
            messages: [],
            useHtml: options.useHtml
        };

        if (options.content) {
            data.messages = data.messages.concat(options.content);
        }

        if (options.developerMessages) {
            data.developerMessages = options.developerMessages;
        }

        if (options.messages) {
            data.messages = data.messages.concat(options.messages);
        }

        if (options.primaryButton) {
            data.primaryButton = options.primaryButton;
        }

        if (options.secondaryButton) {
            data.secondaryButton = options.secondaryButton;
        }

        if (options.tertiaryButton) {
            data.tertiaryButton = options.tertiaryButton;
        }

        const settings = {
            disableClose: options.actionRequired || options.nonRecoverable
        };

        // If a dialog is already open we either override it if we need to, or add this one to the queue
        if (this.dialog) {
            // If we need to force display a dialog we close the current open one without triggering a callback
            if (options.forceDisplay) {
                this.closeDialog();
            } else {
                this.addDialogToQueue({ data, settings });

            }
        }

        // Create and show the dialog
        return this.createDialog(data, settings);
    }

    /**
     * Set dialog callback - this will be called for each dialog
     *
     * @param {Function} callback
     * @memberof DialogService
     */
    registerAfterCloseCallback (callback: Function) {
        this.afterCloseCallback = callback;
    }

    /**
     * Add dialog to queue so it's shown whenever the current one is closed
     *
     * @private
     * @param {DialogQueueItem} item
     * @memberof DialogService
     */
    private addDialogToQueue (item: DialogQueueItem) {
        this.dialogQueue.push(item);
    }

    /**
     * Create and show a dialog
     *
     * @private
     * @param {DialogData} data
     * @param {Partial<MatDialogConfig>} [settings={}]
     * @memberof DialogService
     */
    private createDialog (data: DialogData, settings: Partial<MatDialogConfig> = {}): MatDialogRef<DialogComponent> {
        this.dialog = this.matDialog.open(DialogComponent, { ...this.dialogBaseSettings, ...settings, data });

        this.dialog.afterOpened().toPromise().then(() => {
            if (this.dialog) {
                this.dialog.updatePosition();
                this.dialog.updateSize();
            }
        });

        this.dialog.afterClosed().toPromise().then((callback?: Function) => {
            if (callback) {
                callback();
            }

            // Reset reference
            this.dialog = undefined;
            if (this.dialogQueue.length) {
                const dialogItem = this.dialogQueue.shift();
                if (dialogItem) {
                    this.createDialog(dialogItem.data, dialogItem.settings);
                    return;
                }
            }

            if (this.afterCloseCallback) {
                this.afterCloseCallback();
            }
        });

        return this.dialog;
    }

    /**
     * Close current dialog
     *
     * @private
     * @param {Function} [callback]
     * @memberof DialogService
     */
    private closeDialog (callback?: Function) {
        if (this.dialog) {
            this.dialog.close(callback);
        }
    }
}
