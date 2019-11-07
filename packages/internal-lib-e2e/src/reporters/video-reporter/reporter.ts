import { Screencast } from '../../tools/screencast/screencast';

export class VideoReporter {
    constructor () {
        //
    }

    public jasmineStarted (_summary): void {
        //
    }

    public jasmineDone (): void {
        //
    }

    public suiteStarted (_suit): void {
        //
    }

    public suiteDone (_suit): void {
        //
    }

    public specStarted (spec): void {
        Screencast.testStart(spec.id, spec.fullName);
    }

    public specDone (spec): void {
        Screencast.testEnd(spec.id, spec.fullName);
        // This should not be async since it takes a while
        if (spec.failedExpectations && spec.failedExpectations.length > 0) {
            // Add testcase to render queue to create a video
            Screencast.addToRenderVideoQueue(spec.id, spec.fullName);
        } else {
            Screencast.cleanTestCase(spec.id, spec.fullName);
        }
    }
}
