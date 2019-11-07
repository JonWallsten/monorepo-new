const postcssPresetEnv = require('postcss-preset-env');
module.exports = () => ({ //eslint-disable-line
    plugins: [
        require('postcss-easy-import')(),
        postcssPresetEnv({
            autoprefixer: {
                grid: false,
                overrideBrowserslist: [
                    '> 1%',
                    'last 2 versions',
                    'not dead'
                ]
            }
        })
    ]
});
