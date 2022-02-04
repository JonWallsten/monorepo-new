/**
 * Handle idle processing, i.e the running of tasks taht should not be run immediately.
 *
 * The class handles a queue of functions to run when the system is idle
 */

import { NgZone } from '@angular/core';
import { hasBrowserCapabilities, getWindow } from '@oas/web-lib-core';

/**
 * Definition of the requestIdleCallback interface.
 * TODO: Remove once it is standardized an no longer experimental
 */

type RequestIdleCallbackHandle = any;
type RequestIdleCallbackOptions = {
    timeout: number;
};
type RequestIdleCallbackDeadline = {
    readonly didTimeout: boolean;
    timeRemaining: (() => number);
};

// End of requestIdleCallback interface definition

export class IdleProcessorClass {
    private static _instance: IdleProcessorClass;
    private highPriorityQueue: Array<Function> = [];
    private lowPriorityQueue: Array<Function> = [];
    private readonly useShim: boolean;
    private taskRunner = this.runTasks.bind(this);
    private activeHandle?: RequestIdleCallbackHandle = undefined;
    private zone: NgZone;

    static readonly MAX_WAIT_HIGH_PRIORITY = 500; // Max wait for high priority tasks in ms
    static readonly MAX_WAIT_LOW_PRIORITY = 10000; // Max wait time for low priority tasks in ms

    private constructor () {
        // Setup the requestIdleCallback method to use
        this.useShim = true;
        if (hasBrowserCapabilities()) {
            if (getWindow().requestIdleCallback) {
                this.useShim = false;
            }
        }
    }

    public injectZone (zone: NgZone) {
        this.zone = zone;
    }

    /**
     * Request an idle task with high priority to run
     * @param fnc The function to invoke
     */
    public requestHighPriorityTask (fnc: Function) {
        if (!this.hasHighPriorityTasks()) {
            // We have no high priority tasks in queue yet
            if (this.activeHandle) {
                // We have a queue of low priority entries but got a high priority entry
                // Need to reset the callback with the shorter timeout time
                this.cancelIdleCallback(this.activeHandle);
                this.activeHandle = undefined;
            }
        }
        this.requestTask(fnc, this.highPriorityQueue);
        //console.debug(`[IdleProcessor.requestHighPriorityTask] - ${this.highPriorityQueue.length} high priority tasks in queue`);
    }

    /**
     * Request an idle task with low priority to run
     * @param fnc The function to invoke
     */
    public requestLowPriorityTask (fnc: Function) {
        this.requestTask(fnc, this.lowPriorityQueue);
        //console.debug(`[IdleProcessor.requestLowPriorityTask] - ${this.lowPriorityQueue.length} low priority tasks in queue`);
    }

    /**
     * Internal function to queue a task
     * @param fnc Function to run
     * @param queue Queue to add it to
     */
    private requestTask (fnc: Function, queue: Array<Function>) {
        queue.push(fnc);
        if (!this.activeHandle) {
            // If we are not already active activate us
            this.activateIdleCallback();
        }
    }

    /**
     * Run the queued tasks
     * @param deadline Info about time left etc
     */
    private runTasks (deadline: RequestIdleCallbackDeadline): void {
        let nHighPriorityTasksRun = 0;
        let nLowPriorityTasksRun = 0;
        let time = deadline.timeRemaining();
        //const initialTime = time; // Save initial timeslot
        try {
            const hasHighPriorityTasks = this.hasHighPriorityTasks();
            while (time > 0 || deadline.didTimeout) {
                // Time left or timed out waiting, lets do some work
                const task = this.getOneTask();
                if (!task) {
                    // Ready, no more tasks
                    break;
                }
                // Keep track of number of executed tasks
                if (task.highPriority) {
                    nHighPriorityTasksRun++;
                } else {
                    nLowPriorityTasksRun++;
                }
                try {
                    // Run the task
                    task.fnc();
                } catch (e) {
                    // Something failed
                    console.error(`[IdleProcessor.runTasks] Error occurred in task: ${e.toString()}`, nHighPriorityTasksRun, nLowPriorityTasksRun);
                }
                if (hasHighPriorityTasks && !task.highPriority) {
                    // We started out processing high priority stuff but now we are running low prio so let's wait for next time
                    break;
                }
                // Get remaining time
                time = deadline.timeRemaining();
            }
        } catch (e) {
            console.error(`[IdleProcessor.runTasks] Error occurred before starting task: ${e.toString()}`);
        } finally {
            // Requeue us if we have more work to do
            this.activateIdleCallback();
        }
        //console.debug(`[IdleProcessor.runTasks] - High priority: ${nHighPriorityTasksRun}, Low priority: ${nLowPriorityTasksRun}, Timeslot: ${initialTime}, Deadline reached: ${deadline.didTimeout}`);

    }

    /**
     * Get a queued task to run
     */
    private getOneTask (): { fnc: Function; highPriority: boolean; } | null {
        if (this.highPriorityQueue.length > 0) {
            return { fnc: this.highPriorityQueue.shift()!, highPriority: true };
        } else if (this.lowPriorityQueue.length > 0) {
            return { fnc: this.lowPriorityQueue.shift()!, highPriority: false };
        }
        return null;
    }

    /**
     * Returns true if we have some high priority tasks
     */
    private hasHighPriorityTasks (): boolean {
        return this.highPriorityQueue.length > 0;
    }

    /**
     * Activate the idle callback if we have work to do
     */
    private activateIdleCallback () {
        if (this.highPriorityQueue.length > 0) {
            // More important stuff to do.
            this.activeHandle = this.requestIdleCallback(this.zone ? (args) => this.zone.run(() => this.taskRunner(args)) : this.taskRunner, { timeout: IdleProcessorClass.MAX_WAIT_HIGH_PRIORITY });
            //console.debug(`[IdleProcessor.activateIdleCallback] - Activated for ${this.highPriorityQueue.length} high priority tasks`);
        } else if (this.lowPriorityQueue.length > 0) {
            this.activeHandle = this.requestIdleCallback(this.zone ? (args) => this.zone.run(() => this.taskRunner(args)) : this.taskRunner, { timeout: IdleProcessorClass.MAX_WAIT_LOW_PRIORITY });
            //console.debug(`[IdleProcessor.activateIdleCallback] - Activated for ${this.lowPriorityQueue.length} low priority tasks`);
        } else {
            // No more work to do
            this.activeHandle = undefined;
            //console.debug('[IdleProcessor.activateIdleCallback] - All tasks completed');
        }
    }

    /**
     * Run the correct requestIdleCallback
     * @param callback
     * @param opts
     */
    private requestIdleCallback (callback: ((deadline: RequestIdleCallbackDeadline) => void), opts?: RequestIdleCallbackOptions): RequestIdleCallbackHandle {
        if (this.useShim) {
            return IdleProcessorClass.shimRequestIdleCallback(callback, opts);
        } else {
            return getWindow().requestIdleCallback(callback, opts);
        }
    }

    /**
     * Cancel the callback
     * @param handle
     */
    private cancelIdleCallback (handle: RequestIdleCallbackHandle): void {
        if (this.useShim) {
            return clearTimeout(handle);
        } else {
            return getWindow().cancelIdleCallback(handle);
        }
    }

    /**
     * Shim for requestIdleCallback if it is missing
     * @param callback The function to invoke
     * @param _opts Options (ignored)
     */
    private static shimRequestIdleCallback (callback: ((deadline: RequestIdleCallbackDeadline) => void), _opts?: RequestIdleCallbackOptions): RequestIdleCallbackHandle {
        const start = Date.now();
        return setTimeout(function () {
            callback({
                didTimeout: false,
                timeRemaining: function () {
                    return Math.max(0, 50 - (Date.now() - start));
                }
            });
        }, 1);
    }

    /**
     * Singleton
     *
     * @static
     * @returns
     * @memberof IdleProcessorClass
     */
    public static getInstance () {
        if (!IdleProcessorClass._instance) {
            IdleProcessorClass._instance = new IdleProcessorClass();
        }

        return IdleProcessorClass._instance;
    }

}

// Export instance
export const IdleProcessor = IdleProcessorClass.getInstance();
