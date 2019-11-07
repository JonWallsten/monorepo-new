import CDP from 'chrome-remote-interface';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { VideoGenerator } from './video';
import { directories } from '../protractor.helpers';
import { createHash } from 'crypto';
import rimraf from 'rimraf';

export type ScreencastOptions = {
    port: number;
};

export class Screencast {
    public static readonly baseDir: string = join(directories.testResults, 'screenshots');
    private static client: any;
    private static fileBaseName: string = 'screenshot';
    private static fileExtension: string = 'jpg';
    private static host: string = '127.0.0.1';
    private static renderQueue: Record<string, boolean> = {};
    private static tests: {
        start: number;
        end: number;
        name: string;
    }[] = [];
    private static storedFrames: Record<string, any[]> = {};

    public static async initiate (options: ScreencastOptions): Promise<any> {
        if (this.client) {
            return;
        }
        // Create screenshot base folder
        if (!existsSync(this.baseDir)) {
            try {
                mkdirSync(this.baseDir, { recursive: true });
            } catch (err) {
                if (err.code !== 'EEXIST') {
                    console.error('Could not create output dir: ', this.baseDir, 'Error:', err);
                }
            }
        }

        return (CDP({ host: this.host, port: options.port }) as Promise<any>)
            .then((client) => {
                this.client = client;
            }).catch((error) => {
                console.error('Unable to initiate Chrome DevTools Protocol. Error', error);
            });
    }

    public static async start (options: ScreencastOptions): Promise<any> {
        // Auto initiate if not started
        if (!this.client) {
            await this.initiate(options);
        }
        // Add listener
        this.client.Page.screencastFrame((frame) => this.onScreencastFrame(frame));
        // Start screencast
        await this.client.Page.startScreencast({ format: 'jpeg', everyNthFrame: 1, quality: 70 });
        // console.log('Screencast started: ');
    }

    public static async stop (): Promise<any> {
        if (!this.client) {
            console.warn('[screencast] Client not initiated.');
            return;
        }

        await this.client.Page.stopScreencast();
        await this.client.close();
        // console.log('Screencast stopped');
    }

    public static testStart (id: string, name: string): void {
        if (!this.client) {
            console.warn('[screencast] Client not initiated.');
            return;
        }
        const testCaseName = this.normalize(id, name);

        this.tests.push({
            name: testCaseName,
            start: Date.now() / 1000,
            end: 0
        });
        // console.log('[screencast] Starting ', testCaseName);
    }

    public static testEnd (id: string, name: string): void {
        if (!this.client) {
            console.warn('[screencast] Client not initiated.');
            return;
        }
        const testCaseName = this.normalize(id, name);
        const activeTest = this.tests.find(test => test.name === testCaseName);

        if (!activeTest) {
            return;
        }

        activeTest.end = Date.now() / 1000;
        // console.log('[screencast] Ending ', testCaseName);
    }

    public static addToRenderVideoQueue (id: string, name: string): void {
        const testCaseName = this.normalize(id, name);
        const testCaseFolder = this.screenshotFolderPath(testCaseName);

        if (!this.storedFrames[testCaseName]) {
            throw new Error('[screencast] Could not find screenhots to render for ' + testCaseName);
        }

        // Create a dir for the screenshots
        const screenshotFolder = this.screenshotFolderPath(testCaseName);
        if (!existsSync(screenshotFolder)) {
            try {
                mkdirSync(screenshotFolder, { recursive: true });
            } catch (err) {
                if (err.code !== 'EEXIST') {
                    console.error('Could not create output dir: ', this.baseDir, 'Error:', err);
                }
            }
        }

        this.storedFrames[testCaseName].forEach(frame => {
            const timestamp = frame.metadata.timestamp.toString().replace('.', '');
            writeFileSync(join(testCaseFolder, `${this.fileBaseName}_${timestamp}.${this.fileExtension}`), frame.data, 'base64');
        });

        this.renderQueue[testCaseName] = true;
    }

    public static async renderVideos (): Promise<void> {
        const keys = Object.keys(this.renderQueue);
        // If we have more than 10 failed cases we don't generate videos
        if (!keys.length || Object.keys(this.renderQueue).length > 10) {
            return;
        }

        console.log('Rendering videos... this might take a while.'); // tslint:disable-line no-console

        for (let index = 0; index < keys.length; index++) {
            const testCaseName = keys[index];
            const screenshotFolder = this.screenshotFolderPath(testCaseName);
                // Wait for all screenshots to be generated
            await new Promise((resolve) => {
                VideoGenerator.generate(screenshotFolder, testCaseName).then(() => {
                    delete this.renderQueue[testCaseName];
                }).catch((error) => {
                    console.error(error);
                }).finally(() => {
                    // Clean up images
                    this.cleanTestCase('', testCaseName);
                    resolve();
                });
            });
        }
    }

    public static cleanTestCase (id: string, name: string): void {
        // If id is not provided we got the normalized testCaseName right away
        const testCaseName = id ? this.normalize(id, name) : name;

        const testCaseFolder = this.screenshotFolderPath(testCaseName);
        // Delete frames since we won't need them.
        delete this.storedFrames[testCaseName];

        // Remove folder if exists
        if (existsSync(testCaseFolder)) {
            rimraf.sync(testCaseFolder);
        }

    }

    private static async onScreencastFrame (frame: any): Promise<void> {
        // console.log('Frame recieved');
        const testCase = this.tests.find(test => frame.metadata.timestamp > test.start && (test.end === 0 || frame.metadata.timestamp < test.end));
        const testCaseName = testCase ? testCase.name : '';

        await this.client.Page.screencastFrameAck({ sessionId: frame.sessionId });

        // Get array or create a new one
        this.storedFrames[testCaseName] = this.storedFrames[testCaseName] || [];
        // Push frame
        this.storedFrames[testCaseName].push(frame);
    }


    private static normalize (id: string, name: string): string {
        return name.replace(/[^a-zA-Z0-9_-]/g , '_') + '_' + id;
    }

    private static screenshotFolderPath (testCaseName: string) {
        return join(this.baseDir, createHash('md5').update(testCaseName).digest('hex'));
    }
}
