import { WatchControllerPlugin } from '../../build-tools/plugins/watch-controller';
import * as ngPackage from 'ng-packagr';
import * as yargs from 'yargs';

const argv = yargs.parseSync();

// If watch is activated we handle stuff a bit differently
if (argv.watch) {
    let initialBuild = true;
    const watchControllerPlugin = new WatchControllerPlugin();
    ngPackage
        .ngPackagr()
        .forProject('ng-package.json')
        .withTsConfig('tsconfig.build.json')
        .watch()
        .subscribe(() => {
            if (initialBuild) {
                initialBuild = false;
                return;
            }
            // Trigger rebuild for our dependants
            watchControllerPlugin.buildDoneExternal();
        });
} else {
    ngPackage
        .ngPackagr()
        .forProject('ng-package.json')
        .withTsConfig('tsconfig.build.json')
        .build()
        .catch(error => {
            console.error(error);
            process.exit(1);
        });
}
