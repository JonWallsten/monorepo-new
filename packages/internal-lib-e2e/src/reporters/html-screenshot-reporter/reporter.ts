const DEFAULT_DESTINATION = 'target/';

import { createWriteStream, appendFile, existsSync, mkdirSync, renameSync, appendFileSync, readFileSync, writeFileSync } from 'fs';
import { template as createTemplate, each, assign } from 'lodash';
import uuid from 'uuid';
import { EOL } from 'os';
import { join, dirname } from 'path';
import rimraf from 'rimraf';
import { createHash } from 'crypto';

export class HtmlScreenshotReporter {
    private suites: Record<string, any> = {};   // suite clones
    private specs: Record<string, any> = {};   // tes spec clones
    private runningSuite = null; // currently running suite
    private opts: Record<string, any> = {};
    private screenshots: Record<string, string[]> = {};
    private screenshotUniqueId: number = 0;
    private errorIndicatorFile: string;

    private readonly nonLinkTemplate = createTemplate(/*html*/`
        <li
            id="<%= id %>"
            class="spec <%= cssClass %>"
            data-spec="<%= specId %>"
            data-name="<%= name %>"
            data-browser="<%= browserName %>">
            <%= mark %>
            <%= name %>
            (<%= duration %> s)
            <%= reason %>
            <%= failedUrl %>
        </li>
    `);

    private readonly openReportTemplate = createTemplate(/*html*/`
        <!doctype html>
        <html lang="en">
        <head>
            <meta http-equiv="Content-Security-Policy" content="default-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net;">
            <style type="text/css">
                body {
                    font-family: Helvetica, Arial, sans-serif;
                    font-size: 14px;
                    line-height: 1.4em;
                    -webkit-font-smoothing: antialiased;
                    color: #b9c0ca;
                    background: #282d35;
                    padding-left: 10px;
                }

                a {
                    color: #b9c0ca;
                }

                h1 {
                    font-weight: normal;
                    margin: 20px 0;
                }

                h4 {
                    margin: 10px 0 5px;
                    text-transform: capitalize;
                    letter-spacing: 0.05em;
                    font-weight: normal;
                    font-size: 15px;
                }

                h4+ul h4 {
                    font-size: 14px;
                }

                ul {
                    list-style-position: inside;
                    padding: 0;
                }

                ul ul, ul.summary {
                    padding-left: 40px;
                }

                li.spec {
                    font-family: monospace;
                    padding-left: 10px;
                }

                li img {
                    max-width: 100%;
                }

                li.passed, span.passed {
                    color: #a9cb8f;
                }

                li.failed, span.failed {
                    color: #e68489;
                }

                li.pending, span.pending {
                    color: #daaa7c;
                }

                li.disabled, span.disabled {
                    color: #6f7782;
                }

                li.failed ul {
                    list-style-type: square;
                }

                .pre-reason-message {
                    margin: 0;
                    display: inline-block;
                }

                span.highlight-filename {
                    color: #daaa7c;
                }

                span.stacktrace, .browser-logs {
                    line-height: 1.5;
                    white-space: pre;
                    padding: 5px;
                    border: 1px solid #474c54;
                    background-color: #30353e;
                    color: #b9c0ca;
                    margin: 10px 0;
                }

                .failed .summary-total-failed {
                    color: #e68489;
                }

                .log-error {
                    color: #e68489;
                }

                .quick-links {
                    list-style-type: square;
                    padding-left: 40px;
                    color: #e68489;
                }

                .quick-links a {
                    text-decoration: none;
                    color: #e68489;
                }

                .tobi.tobi--theme-dark {
                    background-color: rgba(31, 31, 31, 0.95);
                }
            </style>
            <%= userCss %>
            <%= userJs %>
            <link rel="stylesheet" type="text/css" href="https://cdn.jsdelivr.net/npm/@rqrauhvmra/tobi@1.9.0/css/tobi.min.css">
            <script type="text/javascript">
                var hasVideos = <%= hasVideos %>;
                function toggle(id, type) {
                    var e = document.getElementById(id + type);
                    var alreadyVisible = e.style.display === "block";

                    // Hide all in case another one is already open
                    document.querySelectorAll('.' + id + 'Toggle').forEach(toggle => {
                        toggle.style.display = 'none';
                    });

                    // Toggle visibility for the active one
                    e.style.display = alreadyVisible ? "none" : "block";
                }
                function buildQuickLinks() {
                    var failedSpecs = document.querySelectorAll("li.failed");
                    var quickLinksContainer = document.getElementById("quickLinks");
                    if (!quickLinksContainer) return;
                    if (failedSpecs.length > 0) {
                        document.getElementById("quickLinksHeader").textContent = "Failed expectations";
                    }
                    for (var i = 0; i < failedSpecs.length; ++i) {
                        var li = document.createElement("li");
                        var a = document.createElement("a");
                        a.href = "#" + failedSpecs[i].id;
                        a.textContent = failedSpecs[i].dataset.name;
                        li.appendChild(a);
                        quickLinksContainer.appendChild(li);
                    }
                }

                function updatePassCount() {
                    var totalPassed = document.querySelectorAll("li.passed").length;
                    var totalFailed = document.querySelectorAll("li.failed").length;
                    var totalSpecs = totalFailed + totalPassed;
                    // console.log("passed: %s, failed: %s, total: %s", totalPassed, totalFailed, totalSpecs);
                    document.getElementById("summaryTotalSpecs").textContent =
                    document.getElementById("summaryTotalSpecs").textContent + totalSpecs;
                    document.getElementById("summaryTotalFailed").textContent =
                    document.getElementById("summaryTotalFailed").textContent + totalFailed;
                    if (totalFailed) {
                        document.getElementById("summary").className = "failed";
                    }
                }

                function checkForVideoFiles (isLocal) {
                    const videoToggles = document.querySelectorAll('.video-toggle');
                    videoToggles.forEach(el => {
                        // Locally we can't check for video files due to cross origin error, so we have to assume there is a video
                        if(isLocal) {
                            el.style.display = 'block';
                            return;
                        }
                        const videoFile = "videos/" + el.getAttribute('data-video');
                        if(videoFile) {
                            var http = new XMLHttpRequest();
                            http.open('HEAD', videoFile, false);
                            http.send();
                            if( http.status !== 404) {
                                el.style.display = 'block';
                            }
                        }
                    });
                }

                function start() {
                    updatePassCount();
                    buildQuickLinks();
                    // Can't check local adresses due to Cross Origin Error
                    // Note: Double escape because of template
                    if(hasVideos) {
                        const isLocal = !window.location.href.match(/https?:\\\/\\\//);
                        checkForVideoFiles(isLocal);
                    }
                }
                window.onload = start;
            </script>
        </head>
        <body>
    `);

    private readonly addReportTitle = createTemplate(/*html*/`
        <h1><%= title %></h1>
    `);

    private readonly addReportSummary = createTemplate(/*html*/`
        <div id="summary" class="passed">
            <h4>Summary</h4>
            <ul class="summary" style="list-style-type: none;">
                <li id="summaryTotalSpecs" class="summary-total-specs">Total specs tested: </li>
                <li id="summaryTotalFailed" class="summary-total-failed">Total failed: </li>
            </ul>
            <%= quickLinks %>
        </div>
    `);

    private readonly addQuickLinks = createTemplate(/*html*/`
        <h4 id="quickLinksHeader"></h4>
        <ul id="quickLinks" class="quick-links"></ul>
    `);

    private readonly closeReportTemplate = createTemplate(/*html*/`
        <script type="text/javascript" src="https://cdn.jsdelivr.net/npm/@rqrauhvmra/tobi@1.9.0/js/tobi.min.js"></script>
        <script type="text/javascript">var tobi = new Tobi({captionsSelector: 'self'});</script>
        </body>
        </html>
    `);

    private readonly reportTemplate = createTemplate(/*html*/`
        <%= report %>
    `);

    private readonly reasonsTemplate = createTemplate(/*html*/`
        <ul>
            <% Object.values(reasons).forEach(function(reason, key) { %>
            <li>
                <pre class="pre-reason-message"><%- reason.message %></pre>
                [<a href="javascript:toggle(\'<%= id %><%= key %>\', 'Stacktrace')">stack</a>]
                <% if(logs) { %>
                    [<a href="javascript:toggle(\'<%= id %><%= key %>\', 'Logs')">log</a>]
                <% } %>
                [<a href="<%= screenshotRelativeDir %><%= screenshots[key] %>" alt="<%= specName %>" class="lightbox" data-group="<%= id %>-screenshot">screenshot</a>]
                <% if(hasVideos) {%>
                <span class="video-toggle" data-video="<%= videoFileName %>" style="display:none;">
                    [<a href="#video-<%= id %>" data-type="html" alt="<%= specName %>" data-group="<%= id %>-video" class="lightbox">video</a>]
                    <div id="video-<%= id %>">
                        <video controls>
                            <source src="videos/<%= videoFileName %>" type="video/mp4">
                            Your browser does not support the video tag.
                        </video>
                    </div>
                </span>
                <% } %>
                <br/>
                <span style="display: none" id="<%= id %><%= key %>Stacktrace" class="stacktrace <%= id %><%= key %>Toggle"><%= highlightFileName(reason.stack) %></span>
                <% if(logs) { %>
                    <span style="display: none" id="<%= id %><%= key %>Logs" class="browser-logs <%= id %><%= key %>Toggle"><%= logs %></span>
                <% } %>
            </li>
            <% }); %>
        </ul>
    `);

    private readonly failedUrlTemplate = createTemplate(/*html*/`
        <ul>
            <li>Failed at url: <a href="<%= failedUrl %>"><%= failedUrl %></a></li>
        </ul>
    `);

    private readonly configurationTemplate = createTemplate(/*html*/`
        <a href="javascript:toggle(\'<%= configId %>\')">
            Toggle Configuration
        </a>
        <div class="config" id="<%= configId %>" style="display: none">
            <h4>Configuration</h4>
            <%= configBody %>
        </div>
    `);

    private readonly objectToItemTemplate = createTemplate(/*html*/`
        <li>
            <%= key %>:  <%= value %>
        </li>
    `);


    // report marks
    private readonly marks = {
        pending:'<span class="pending">*</span>',
        failed: '<span class="failed">&#10007;</span>',
        passed: '<span class="passed">&#10003;</span>',
        disabled: '<span class="disabled">!</span>'
    };

    private readonly statusCssClass = {
        pending: 'pending',
        failed:  'failed',
        passed:  'passed',
        disabled:  'disabled'
    };

    // when use use fit, jasmine never calls suiteStarted / suiteDone, so make a fake one to use
    private fakeFocusedSuite = {
        id: 'focused',
        description: 'focused specs',
        fullName: 'focused specs'
    };

    constructor (opts) {
        // TODO: more options
        this.opts = opts || {};
        this.opts.app = opts.app || '';
        this.opts.preserveDirectory = opts.preserveDirectory || false;
        this.opts.dest = this.getOutputDir();
        this.opts.suiteName = opts.suiteName || '';
        this.opts.testStatisticsFile = opts.testStatisticsFile || '';
        this.opts.reportName = opts.reportName || 'report';
        this.opts.screenshotDir = opts.screenshotDir || '';
        this.opts.ignoreSkippedSpecs = opts.ignoreSkippedSpecs || false;
        this.opts.reportOnlyFailedSpecs = opts.hasOwnProperty('reportOnlyFailedSpecs') ? opts.reportOnlyFailedSpecs : true;
        this.opts.captureOnlyFailedSpecs = opts.captureOnlyFailedSpecs || false;
        this.opts.metadataBuilder = opts.metadataBuilder || this.metadataBuilder;
        this.opts.userCss = Array.isArray(opts.userCss) ? opts.userCss : opts.userCss ? [ opts.userCss ] : [];
        this.opts.userJs = Array.isArray(opts.userJs) ? opts.userJs : opts.userJs ? [ opts.userJs ] : [];
        this.opts.totalSpecsDefined = null;
        this.opts.showSummary = opts.hasOwnProperty('showSummary') ? opts.showSummary : true;
        this.opts.showQuickLinks = opts.showQuickLinks || false;
        this.opts.browserCaps = {};
        this.opts.configurationStrings = opts.configurationStrings || {};
        this.opts.showConfiguration = opts.hasOwnProperty('showConfiguration') ? opts.showConfiguration : true;
        this.opts.reportTitle = opts.hasOwnProperty('reportTitle') ? opts.reportTitle : 'Report';
        this.opts.reportFailedUrl = opts.reportFailedUrl || false;
        this.opts.inlineImages = opts.inlineImages || false;
        this.opts.hasVideos = opts.hasVideos || false;
        this.opts.errorFilefailed = true;
        this.errorIndicatorFile = join(this.opts.dest, '.error-' + this.opts.suiteName);
    }

    public storeBrowserLog (result: Record<string, any>) {
        const spec = this.getSpecCloneById(result.id);
        return (global as any).browser.manage().logs().get('browser').then((browserLog) => {
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
                // If spec failed we store the browser log in the spec
                if (result.status === 'failed') {
                    spec._logs = parsedMessages.join('\r\n');
                }
                return appendFileSync(this.getOutputDir() + 'browser-output.log', '#' + spec.fullName + EOL + parsedMessages.join(EOL) + EOL + EOL);
            }
        });
    }

    private enableStoreBrowserLog () {
        //Takes screen shot for expect failures
        const jasmine: any = (global as any).jasmine;
        const originalExecute = jasmine.Spec.prototype.execute;
        // Since we need to preserve the scope for addExpectationResult
        const context = this;

        jasmine.Spec.prototype.execute = function () {
            const args = arguments;
            const orig = args[0];
            const executeContext = this;
            // Hijack onComplete function to store the browerLog
            args[0] = async function () {
                // Only store on failed
                await context.storeBrowserLog(executeContext);
                orig.apply(this);
            };

            return originalExecute.apply(this, args);
        };

    }

    private enableScreenshotExpectFailure () {
        //Takes screen shot for expect failures
        const jasmine: any = (global as any).jasmine;
        const originalAddExpectationResult = jasmine.Spec.prototype.addExpectationResult;
        // Since we need to preserve the scope for addExpectationResult
        const context = this;
        jasmine.Spec.prototype.addExpectationResult = function () {

            if (!arguments[0]) {
                // take screenshot
                (global as any).browser.takeScreenshot().then((png) => {

                    const fileName = (this.result.fullName.replace(/[^a-zA-Z0-9_-]/g , '_') + '-' + 'expect failure-' + context.screenshotUniqueId++).replace(/[\/\\]/g, ' ') + '.png';
                    const filePath = context.getScreenshotDir();
                    if (!existsSync(filePath)) {
                        mkdirSync(filePath);
                    }
                    try {
                        const stream = createWriteStream(filePath + fileName);
                        stream.write(Buffer.from(png, 'base64'));
                        stream.end();
                    } catch (err) {
                        console.error('[html-screenshot-reporter] Could not create screenshot. Error:', err);
                    }

                    // Add screenshots filename to array so we can output it in the report
                    context.screenshots[context.getSpecUniqueId(this.result)] = [
                        ...(context.screenshots[context.getSpecUniqueId(this.result)] || []),
                        fileName
                    ];
                }).catch((err) => {
                    console.error('Error while taking screenshot - ' + err.message);
                });
            }
            return originalAddExpectationResult.apply(this, arguments);
        };
    }

    private storeFailingTestStats (spec) {
        if (!this.opts.testStatisticsFile) {
            throw new Error('[html-screenshot-reporter] opts.testStatisticsFile is missing');
        }
        // Make sure file exists
        const statsDir = dirname(this.opts.testStatisticsFile);
        if (!existsSync(statsDir)) {
            try {
                mkdirSync(statsDir, { recursive: true });
            } catch (err) {
                if (err.code !== 'EEXIST') {
                    console.error('Could not create output dir: ', statsDir, 'Error:', err);
                }
            }
        }
        // Set default value
        let stats = {};
        const statsKey = `[${this.opts.app}] ${spec.fullName}`;

        // Check if file already exists and overwrite the value if it does
        if (existsSync(this.opts.testStatisticsFile)) {
            const rawStats = readFileSync(this.opts.testStatisticsFile, { encoding: 'utf8' });
            stats = rawStats ? JSON.parse(rawStats) : {};
        }
        // Increase one or start with one of it's the first
        stats[statsKey] = stats[statsKey] ? stats[statsKey] + 1 : 1;

        // Save stats
        try {
            writeFileSync(this.opts.testStatisticsFile, JSON.stringify(stats, null, 4), { encoding: 'utf8' });
        } catch (err) {
            console.error('Error writing to file:' + this.opts.testStatisticsFile);
        }
    }

    // returns suite clone or creates one
    private getSuiteClone (suite) {
        if (!this.suites[suite.id]) {
            this.suites[suite.id] = {};
        }

        this.suites[suite.id] = {
            ...this.suites[suite.id],
            ...suite
        };

        return this.suites[suite.id];
    }

    // returns spec clone or creates one
    private getSpecClone (spec) {
        if (!this.specs[spec.id]) {
            this.specs[spec.id] = {};
        }

        this.specs[spec.id] = {
            ...this.specs[spec.id],
            ...spec
        };

        return this.specs[spec.id];
    }

    private getSpecCloneById (specId: string) {
        return this.specs[specId];
    }

    // returns duration in seconds
    private getDuration (obj) {
        if (!obj._started || !obj._finished) {
            return 0;
        }
        const duration = (obj._finished - obj._started) / 1000;
        return (duration < 1) ? duration : Math.round(duration);
    }

    private metadataBuilder () {
        return false;
    }

    private isSpecValid (spec) {
        // Don't screenshot skipped specs
        const isSkipped = this.opts.ignoreSkippedSpecs && (spec.status === 'pending' || spec.status === 'disabled');
        // Screenshot only for failed specs
        const isIgnored = this.opts.captureOnlyFailedSpecs && spec.status !== 'failed';

        return !isSkipped && !isIgnored;
    }

    private isSpecReportable (spec) {
        return (this.opts.reportOnlyFailedSpecs && spec.status === 'failed') || !this.opts.reportOnlyFailedSpecs;
    }

    private hasValidSpecs (suite) {
        let validSuites = false;
        let validSpecs = false;

        if (suite._suites.length) {
            validSuites = suite._suites.some(s => this.hasValidSpecs(s));
        }

        if (suite._specs.length) {
            validSpecs = suite._specs.some(s => this.isSpecValid(s) || this.isSpecReportable(s));
        }

        return validSuites || validSpecs;
    }

    private getOutputDir () {
        return (this.opts.dest || DEFAULT_DESTINATION);
    }

    private getScreenshotDir (relative?: boolean) {
        if (!this.opts.screenshotDir) {
            return relative ? '' : this.getOutputDir();
        }
        return relative ? this.opts.screenshotDir + '/' : this.getOutputDir() + this.opts.screenshotDir + '/';
    }

    private getCssLinks (cssFiles) {
        let cssLinks = '';

        each(cssFiles, function (file) {
            cssLinks += '<link type="text/css" rel="stylesheet" href="' + file + '">';
        });

        return cssLinks;
    }

    private getJsScripts (jsFiles) {
        let jsScripts = '';

        each(jsFiles, function (file) {
            jsScripts += '<script src="' + file + '"></script>';
        });

        return jsScripts;
    }

    private getSpecUniqueId (spec) {
        return 'spec' + createHash('md5').update(spec.id + spec.fullName).digest('hex');
    }

    private printReasonsForFailure (spec) {
        if (spec.status !== 'failed') {
            return '';
        }

        const suiteFullName = spec._suite ? spec._suite.fullName : '';

        return this.reasonsTemplate({
            id: this.getSpecUniqueId(spec),
            highlightFileName: this.highlightFileName,
            reasons: spec.failedExpectations,
            specName: this.escapeInvalidXmlChars(spec.fullName.replace(suiteFullName, '').trim()),
            screenshotRelativeDir: this.getScreenshotDir(true),
            screenshots: this.screenshots[this.getSpecUniqueId(spec)] || [],
            videoFileName: spec._videoFileName,
            hasVideos: this.opts.hasVideos,
            logs: spec._logs && spec._logs.length ? spec._logs : null
        });
    }

    private highlightFileName (stacktrace: string) {
        const lines = stacktrace.split(/\r?\n/);
        lines.forEach((line, index) => {
            if (line.match(/packages[/\\\\](?:web|internal)-(?:app|lib)-[a-z]+[/\\\\](?!node_modules)[^/\\\\]*[/\\\\]/)) {
                // Highlight filename
                line = line.replace(/([^\\\/]+)(:\d+:\d+.*)$/, '<span class="highlight-filename">$1</span>$2');
            }
            // Replace cwd with ...
            if (line.match(/^([^\/]*\/opt\/oas\/jenkins\/slave\/workspace\/)(?:[^\/]*)(.*)$/)) {
                line = line.replace(/^([^\/]*\/opt\/oas\/jenkins\/slave\/workspace\/)(?:[^\/]*)(.*)$/, '$1...$2');
            }

            lines[index] = line;
        });
        return lines.join('\r\n');
    }

    private printFailedUrl (spec) {
        if (spec.status !== 'failed' || !this.opts.reportFailedUrl) {
            return '';
        }

        return this.failedUrlTemplate({
            failedUrl: spec.failedAtUrl
        });
    }

    private escapeInvalidXmlChars (str) {
        return str.replace(/\&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/\>/g, '&gt;')
            .replace(/\"/g, '&quot;')
            .replace(/\'/g, '&apos;')
            .replace(/[\x1b]/g, ''); //Remove control character
    }

    private printSpec (spec) {
        const suiteFullName = spec._suite ? spec._suite.fullName : '';

        if (spec.isPrinted || (spec.skipPrinting && !this.isSpecReportable(spec))) {
            return '';
        }

        spec.isPrinted = true;
        return this.nonLinkTemplate({
            browserName: this.opts.browserCaps.browserName,
            cssClass: this.statusCssClass[spec.status],
            duration: this.getDuration(spec),
            id: uuid.v1(),
            mark: this.marks[spec.status],
            name: this.escapeInvalidXmlChars(spec.fullName.replace(suiteFullName, '').trim()),
            reason: this.printReasonsForFailure(spec),
            failedUrl: this.printFailedUrl(spec),
            specId: this.getSpecUniqueId(spec)
        });
    }

    private printResults (suite) {
        suite = this.getSuiteClone(suite);

        let output = '';

        if (suite.isPrinted || !this.hasValidSpecs(suite)) {
            return '';
        }

        suite.isPrinted = true;
        output += '<ul style="list-style-type:none">';
        output += '<h4>' + suite.description + ' (' + this.getDuration(suite) + ' s)</h4>';

        each(suite._specs, (spec) => {
            spec = this.specs[spec.id];
            output += this.printSpec(spec);

            if (this.opts.testStatisticsFile && process.env.IS_MASTER === 'true' && spec.status === 'failed') {
                this.storeFailingTestStats(spec);
            }
        });

        if (suite._suites.length) {
            each(suite._suites, (childSuite) => {
                output += this.printResults(childSuite);
            });
        }

        output += '</ul>';

        return output;
    }

    private printTestConfiguration () {
        let testConfiguration = {
            'Jasmine version': (jasmine as any).version,
            'Browser name': this.opts.browserCaps.browserName,
            'Browser version': this.opts.browserCaps.browserVersion,
            'Platform': this.opts.browserCaps.platform,
            'Javascript enabled': this.opts.browserCaps.javascriptEnabled,
            'Css selectors enabled': this.opts.browserCaps.cssSelectorsEnabled
        };

        testConfiguration = assign(testConfiguration, this.opts.configurationStrings);

        const keys = Object.keys(testConfiguration);

        let configOutput = '';
        each(keys, (key) => {
            configOutput += this.objectToItemTemplate({ 'key': key, 'value': testConfiguration[key] });
        });

        const configId = uuid.v1();
        return this.configurationTemplate({ 'configBody': configOutput, 'configId': configId });
    }

    private getVideoFileName (id: string, name: string): string {
        return name.replace(/[^a-zA-Z0-9_-]/g , '_') + '_' + id + '.mp4';
    }

    private getReportFilePath (final?: boolean) {
        const hasError = existsSync(this.errorIndicatorFile);
        const reportFileName = this.opts.reportName + (this.opts.suiteName ? '-' + this.opts.suiteName : '') + (final && hasError ? '-FAILED' : '') + '.html';
        return join(this.opts.dest, reportFileName);
    }

    public beforeLaunch (callback: Function) {
        // console.log('Report destination:  ', path.join(this.opts.dest, this.opts.filename)); //tslint:disable-line no-console
        const cssLinks = this.getCssLinks(this.opts.userCss);
        const jsScripts = this.getJsScripts(this.opts.userJs);
        const summaryQuickLinks = this.opts.showQuickLinks ? this.addQuickLinks() : '';
        const reportSummary = this.opts.showSummary ? this.addReportSummary({ quickLinks: summaryQuickLinks }) : '';

        // Now you'll need to build the replacement report text for the file.
        let reportContent = this.openReportTemplate({ userCss: cssLinks, userJs: jsScripts, hasVideos: this.opts.hasVideos });
        reportContent += this.addReportTitle({ title: this.opts.reportTitle });
        reportContent += reportSummary;

        appendFile(
            this.getReportFilePath(),
            reportContent,
            { encoding: 'utf8' },
            (_err) => {
                if (_err) {
                    console.error('Error writing to file: ' + this.getReportFilePath());
                    throw _err;
                }
                callback();
            }
        );

    }

    public afterLaunch (callback: Function) {
        // console.log('Closing report'); //tslint:disable-line no-console
        appendFile(
            this.getReportFilePath(),
            this.closeReportTemplate(),
            { encoding: 'utf8' },
            (err) => {
                if (err) {
                    console.error('Error writing to file:' + this.getReportFilePath());
                    throw err;
                }
                // If failed we rename the report with
                if (existsSync(this.errorIndicatorFile)) {
                    try {
                        renameSync(this.getReportFilePath(), this.getReportFilePath(true));
                        rimraf.sync(this.errorIndicatorFile);
                    } catch (err) {
                        console.error('[html-screenshot-reporter] Failed renaming report. Error:', err);
                    }
                }
                callback();
            }
        );
    }

    public jasmineStarted (suiteInfo) {
        this.opts.totalSpecsDefined = suiteInfo.totalSpecsDefined;

        /**
         * Dirty fix to make sure last screenshot is always linked to the report
         * TODO: remove once we're able to return a promise from specDone / suiteDone
         */
        afterAll(process.nextTick);

        (global as any).browser.forkedInstances = {
            'main': (global as any).browser
        };

        (global as any).browser.getCapabilities().then(capabilities => {
            this.opts.browserCaps.browserName = capabilities.get('browserName');
            this.opts.browserCaps.browserVersion = capabilities.get('version');
            this.opts.browserCaps.platform = capabilities.get('platform');
            this.opts.browserCaps.javascriptEnabled = capabilities.get('javascriptEnabled');
            this.opts.browserCaps.cssSelectorsEnabled = capabilities.get('cssSelectorsEnabled');
        });

        this.enableScreenshotExpectFailure();
        this.enableStoreBrowserLog();
    }

    public suiteStarted (suite) {
        suite = this.getSuiteClone(suite);
        suite._suites = [];
        suite._specs = [];
        suite._started = Date.now();
        suite._parent = this.runningSuite;

        if (this.runningSuite) {
            this.runningSuite._suites.push(suite);
        }

        this.runningSuite = suite;
    }

    public suiteDone (suite) {
        suite = this.getSuiteClone(suite);
        if (suite._parent === undefined) {
        // disabled suite (xdescribe) -- suiteStarted was never called
            this.suiteStarted(suite);
        }
        suite._finished = Date.now();
        this.runningSuite = suite._parent;
    }

    public specStarted (spec) {
        if (!this.runningSuite) {
            // focused spec (fit) -- suiteStarted was never called
            this.suiteStarted(this.fakeFocusedSuite);
        }
        spec = this.getSpecClone(spec);
        spec._started = Date.now();
        spec._suite = this.runningSuite;
        spec._videoFileName = this.getVideoFileName(spec.id, spec.fullName);
        this.runningSuite._specs.push(spec);
    }

    public specDone (spec) {
        spec = this.getSpecClone(spec);
        spec._finished = Date.now();

        if (!this.isSpecValid(spec)) {
            spec.skipPrinting = true;
            return;
        }
        // Create an error file so we now we have at least one error
        if (spec.failedExpectations && spec.failedExpectations.length) {
            appendFileSync(this.errorIndicatorFile, '');
        }

        if (this.opts.reportFailedUrl) {
            if (spec.status === 'failed') {
                (global as any).browser.getCurrentUrl().then((url) => {
                    spec.failedAtUrl = url;
                });
            }
        }
    }

    public jasmineDone () {
        let output = '';

        if (this.runningSuite) {
        // focused spec (fit) -- suiteDone was never called
            this.suiteDone(this.fakeFocusedSuite);
        }

        each(this.suites, (suite) => {
            output += this.printResults(suite);
        });

        // Add configuration information when requested and only if specs have been reported.
        if (this.opts.showConfiguration) {
            let suiteHasSpecs = false;

            each(this.specs, (spec) => {
                suiteHasSpecs = spec.isPrinted || suiteHasSpecs;
            });

            if (suiteHasSpecs) {
                output += this.printTestConfiguration();
            }
        }

        try {
            appendFileSync(
                this.getReportFilePath(),
                this.reportTemplate({ report: output }),
                { encoding: 'utf8' }
            );
        } catch (err) {
            console.error('Error writing to file:' + this.getReportFilePath());
        }
    }
}
