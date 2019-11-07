/* Include all javascript files from the app */
const reqDoc = (require as IWebpackRequire).context('./app/', true, /^(?!.*\.test\.js$).*\.js$/);
reqDoc.keys().forEach(reqDoc);
