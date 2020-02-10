import * as ngPackage from 'ng-packagr';
import yargs from 'yargs';

const argv = yargs.argv;

ngPackage
  .ngPackagr()
  .forProject('ng-package.json')
  .withTsConfig('tsconfig.build.json')
  .withOptions({ watch: (argv.watch as boolean) })
  .build()
  .catch(error => {
      console.error(error);
      process.exit(1);
  });
