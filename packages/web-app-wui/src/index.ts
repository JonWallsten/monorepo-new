/**
 * Polyfills
 */

/**
 * Vendors
 */
// eslint-disable-next-line @typescript-eslint/no-require-imports
require('angular');

import '../../../node_modules/ace-builds/src-noconflict/ace.js';
import '../../../node_modules/ace-builds/src-noconflict/ext-language_tools.js';
import '../../../node_modules/ace-builds/src-noconflict/ext-searchbox.js';
import '../../../node_modules/ace-builds/src-noconflict/mode-javascript.js';
import '../../../node_modules/ace-builds/src-noconflict/mode-xml.js';
import '../../../node_modules/ace-builds/src-noconflict/snippets/javascript.js';
import '../../../node_modules/ace-builds/src-noconflict/snippets/text.js';
import '../../../node_modules/ace-builds/src-noconflict/theme-chrome.js';

import '../node_modules/angular-diff-match-patch/angular-diff-match-patch.js';
import '../node_modules/angular-messages/angular-messages.js';
import '../node_modules/angular-sanitize/angular-sanitize.js';

import '../node_modules/angular-ui-ace/src/ui-ace.js';
import '../node_modules/angular-ui-bootstrap/dist/ui-bootstrap-tpls.js';
import '../node_modules/angular-ui-router/release/angular-ui-router.js';

import '../node_modules/ng-file-upload/dist/ng-file-upload.js';
import '../node_modules/ui-select/dist/select.js';

import { OasAppInitiator } from './app/app';

new OasAppInitiator();
