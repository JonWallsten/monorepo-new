import { existsSync, mkdirSync, appendFileSync, writeFile, readFileSync } from 'fs';
import { EOL } from 'os';
import { browser } from 'protractor';
const SELECTOR_PREFIX = '_oas_';
const tests = './test/e2e/';
const testResults = './.test_results/';
const tmp = tests + '.tmp/';
const testStructureFiles = tmp + 'teststructures/';
const testDataFiles = tests + 'testdata/';
const performanceData = testResults + 'performance_data/';
const htmlReport = testResults + 'html_report/';
const junitReport = testResults + 'junit_report/';
const ELEMENT_TIMEOUT = 35000; // ms
const COMMAND_WAIT = 100; // ms
const debug = process.env.debug || false;
// Make sure all directories exists

const createTestDirectories = () => {
    [
        tmp,
        testResults,
        testStructureFiles,
        testDataFiles,
        performanceData,
        junitReport,
        htmlReport
    ].forEach(function (folder) {
        if (!existsSync(folder)) {
            mkdirSync(folder);
        }
    });
};

const log = (message) => {
    if (debug) {
        console.log(message); //tslint:disable-line
    }
};

const info = (message) => {
    console.log(message); //tslint:disable-line
};

// Create an attribute selector
const __ = (selector: string, suffix?: string) => {
    return '[' + SELECTOR_PREFIX + selector + ']' + (suffix ? ' ' + suffix : '');
};

const storeBrowserLog = (description?: string) => {
    const logFile = htmlReport + 'browser_output.log';

    return browser.manage().logs().get('browser').then((browserLog) => {
        const parsedMessages = browserLog.map(message => {
            const messageContent = message.message.match(/\"(.*)/);
            if (!messageContent) {
                return '';
            }
            const text = messageContent[0].replace(/(?:\\r\\n|\\r|\\n)/g, EOL);
            const severity = message.level.toString().replace('SEVERE', 'ERROR');
            if (severity === 'WARNING') {
                return '';
            }
            return `[${severity}] ${text}`;
        }).filter(text => text !== '');

        if (parsedMessages.length) {
            return appendFileSync(logFile, '#' + description + EOL + parsedMessages.join(EOL) + EOL + EOL);
        }
    });
};

const writePerfFile = (fileName: string, data: string) => {
    writeFile(performanceData + fileName + '.csv', data, (err) => {
        if (err) {
            console.error(err);
        }
    });
};

const directories = {
    tests,
    testResults,
    testDataFiles,
    testStructureFiles,
    performanceData,
    junitReport,
    htmlReport
};

const getTodaysDate = () => {
    const today = new Date();

    // Separate date into day, month and year
    const dayNr = today.getDate();
    const monthNr = today.getMonth() + 1; //January is 0!
    const year = today.getFullYear();

    // Add leading zero if day or month is less than 10
    const dayString = dayNr > 9 ? dayNr.toString() : '0' + dayNr;
    const monthString = monthNr > 9 ? monthNr.toString() : '0' + monthNr;

    return year + '-' + monthString + '-' + dayString;
};

const getTestObject = (structureFile: string, obj: string) => {
    const xmlFile = readFileSync(structureFile, 'utf-8');
    // Remove first two lines from file
    const objects = xmlFile.toString().split('\n');
    let foundObj = '';
    // Go through each line to find the object name
    objects.forEach((line) => {
        if (line.endsWith(`objectName:${obj}`)) {
            const foundObjArray = line.match(/^-?\d+:(\d+)/);
            // Get object instance if reference was found
            if (foundObjArray) {
                foundObj = foundObjArray[1];
            }
        }
    });
    return foundObj;
};

export {
    directories,
    ELEMENT_TIMEOUT,
    COMMAND_WAIT,
    log,
    info,
    __,
    getTodaysDate,
    getTestObject,
    storeBrowserLog,
    writePerfFile,
    createTestDirectories
};
