import webpackDevConfig from './config/webpack.dev';
import webpackProdConfig from './config/webpack.prod';
/**
 * Look in ./config folder for webpack.dev.js
 */
let config;

switch (process.env.NODE_ENV) {
case 'prod':
case 'production':
    config = webpackProdConfig();
    break;
case 'dev':
case 'development':
default:
    config = webpackDevConfig();
}

export default config;
