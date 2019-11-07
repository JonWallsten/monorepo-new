/**
 * Polyfills
 */
import '../../../polyfills/es6-es7';
import '../../../polyfills/legacy';

/**
 * Vendors
 */
/* tslint:disable:no-require-imports no-var-requires */
window.postal = require('postal');
window.$ = window.jQuery = require('jquery');
require('angular');
require('lodash');
require('moment-timezone');
require('moment');
/* tslint:enable:no-require-imports */

import '../../../node_modules/ace-builds/src-noconflict/ace.js';
import '../../../node_modules/ace-builds/src-noconflict/ext-language_tools.js';
import '../../../node_modules/ace-builds/src-noconflict/ext-searchbox.js';
import '../../../node_modules/ace-builds/src-noconflict/theme-chrome.js';
import '../../../node_modules/@fortawesome/fontawesome-free/css/all.css';

import '../node_modules/angular-diff-match-patch/angular-diff-match-patch.js';
import '../node_modules/angular-messages/angular-messages.js';
import '../node_modules/angular-sanitize/angular-sanitize.js';
import '../node_modules/angular-translate/dist/angular-translate.js';
import '../node_modules/angular-ui-ace/src/ui-ace.js';
import '../node_modules/angular-ui-bootstrap/dist/ui-bootstrap-tpls.js';
import '../node_modules/angular-ui-router/release/angular-ui-router.js';

import '../node_modules/ng-file-upload/dist/ng-file-upload.js';
import '../node_modules/ui-select/dist/select.js';

import '../node_modules/ui-select/dist/select.css';


/**
 * Library files
 * Note: Since angular-lib isn't exporting the angular.module but rather include it we need to inject the dist files the old way
 */
import '../node_modules/@oas/web-lib-angular-js/dist/index.js';
import '../node_modules/@oas/web-lib-angular-js/dist/legacy.js';
import '../node_modules/@oas/web-lib-angular-js/dist/index.css';
import '../node_modules/@oas/web-lib-angular-js/dist/legacy.css';

import { OasAppInitiator } from './app/app';

new OasAppInitiator(); //tslint:disable-line no-unused-expression
