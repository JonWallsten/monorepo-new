/* Include all javascript files from the app */
const reqWUI = (require as IWebpackRequire).context('./app/', true, /^(?!.*\.test\.js$).*\.js$/);
reqWUI.keys().forEach(reqWUI);
