/* Include all javascript files from the app */
const reqStructure = (require as IWebpackRequire).context('./app/', true, /^(?!.*\.test\.js$).*\.js$/);
reqStructure.keys().forEach(reqStructure);
