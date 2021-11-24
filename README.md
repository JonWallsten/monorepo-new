# monorepo-new
This repo is using the new way of doing things. Single root tsconfig, build configs for each folder, and I have removed as many symlinks as possible. But as you can see I still have to use some of them to be able to build the project (but I have spent 0 time trying to make it work without them. All focus has been on trying to strip the repo and get it to build so you can take a look).<br/>
I will start creating the old repo now with Angular 8 and the old way of doing imports/symlinks.<br/><br/>
<b>Install</b><br/>
npm run full-install<br/>
<b>Run</b><br/>
npm run dev<br/>
<br/>
<b>Apps</b><br/>
Prime - web-app-prime - TS/Angular 9 - host app: http://localhost:4000/#/<br/>
Edit - web-app-prime - TS/Angular 9 - iframe app): http://localhost:3060/#/<br/>
WUI - web-app-wui - TS/JS/Angular 1.5 - iframe app: http://localhost:3010/#/example / http://localhost:3010/#/example-js<br/>
<b>Libs</b><br/>
Core - web-lib-core - compiled - TS/JS<br/>
Common - web-lib-common - compiled - TS<br/>
Angular - web-lib-angular - non-compiled - TS/Angular 9<br/>
Internal E2E Lib - Don't mind this<br/>
<br/>
Run a single application:<br/>
npm run dev:edit<br/>
<br/>
If you need to debug any library or application:<br/>
Replace "npm run webpack-dev-server" or "npm run webpack" to "npm run webpack-dev-server:debug" or "npm run webpack:debug" in the "dev" script in the package you want to debug.

<br/>
<b>Notes</b><br/>
...
<br/>
Our goal is to have all dep in the root package.json, but as long as we have to generations of angular it felt cleaner to devide them.<br/>
<br/>
<b>Disclaimer</b><br/>
Just some background. This repo is old and has A LOT of legacy and weird things. Before I joined 1.5 year ago it was barely any TS, it was built in a bad way with gulp and we only used Angular 1.5. And it wasn't a monorepo.<br/>
Last summer I converted everything to a monorepo and created/crafted all the build tools. I did not have enough deep knowledge about TS/Compilers/etc. to do a optimal implementation, obviously. But I did manage to get everything to work after all.<br/>
<br/>
