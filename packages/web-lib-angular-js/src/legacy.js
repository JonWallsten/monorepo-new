// TODO: refactor every *.js to TypeScript to avoid this
// Require all JS-files until they are converted to TS
var req = require.context('./', true, /^(?!.*\.test\.js$).*\.js$/);
req.keys().forEach(req);