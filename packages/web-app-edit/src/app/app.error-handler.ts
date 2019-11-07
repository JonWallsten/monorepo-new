import { Injectable, ErrorHandler } from '@angular/core';
import { OasLogExport } from '@oas/web-lib-core';

@Injectable()
export class AppErrorHandler extends ErrorHandler {
    private loggedErrors: Record<string, number>;

    constructor () {
        super(); // Default Angular ErrorHandler
        this.loggedErrors = {};
    }

    handleError (error: any): void {
        const shortErrorDescription: string = error && error.name ? (error.name + ': ' + error.message) : 'Unknown error';
        const longErrorDescription: string = error && error.stack && error.stack.toString();

        // Keep count of logged errors
        const alreadyLogged: boolean = !!this.loggedErrors[shortErrorDescription];
        this.loggedErrors[shortErrorDescription] = alreadyLogged ? ++this.loggedErrors[shortErrorDescription] : 1;

        // Log exceptions to an external server (oaslogstash) when it first occurs
        // Avoid externally logging everything since Angular templates can generate the same error a lot of times
        if (this.loggedErrors[shortErrorDescription] < 6) { // Arbitrary limit to stop logging recurring errors
            OasLogExport.logstashWeb({
                app_operation: 'exception',
                full_message: longErrorDescription,
                short_message: shortErrorDescription,
                level: '3'
            });
        }

        // Default Angular ErrorHandler
        if (error) {
            super.handleError(error);
        }
    }
}
