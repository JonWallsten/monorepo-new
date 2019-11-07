import webpackMerge from 'webpack-merge';
import * as helpers from './helpers';
import commonConfig from './webpack.base';

/**
 * Webpack Plugins
 */
import TerserPlugin from 'terser-webpack-plugin';

export default () => {
    const ENV = process.env.NODE_ENV = process.env.ENV = 'production';
    const useSourcemaps: boolean = process.env.USE_SOURCEMAPS !== undefined;

    return webpackMerge(commonConfig({ env: ENV }), {
        mode: ENV,

        module: {

            rules: [
                {
                    test: /\.ts$/,
                    loader: 'ts-loader',
                    options: {
                        configFile: '../tsconfig.build.json'
                    },
                    include: helpers.include
                }
            ]

        },
        devtool: useSourcemaps && 'source-map-inline',

        optimization: {
            minimizer: [
                new TerserPlugin({
                    terserOptions: {
                        ecma: 5,
                        keep_classnames: true,
                        keep_fnames: true,
                        sourceMap: useSourcemaps && {
                            url: 'inline'
                        }
                    }
                })
            ]
        }
    });
};
