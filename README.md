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
DOC - web-app-doc - TS/JS/Angular 1.5 - iframe app: http://localhost:3030/#/example / http://localhost:3030/#/example-js<br/>
Structure - web-app-structure - TS/JS/Angular 1.5 - iframe app: http://localhost:3080/#/example / http://localhost:3080/#/example-js<br/><br/>
<b>Libs</b><br/>
Core - web-lib-core - compiled - TS/JS<br/>
Common - web-lib-common - compiled - TS<br/>
AngularJs - web-lib-angular-js - compiled - TS/JS/Angular 1.5<br/>
Angular - web-lib-angular - non-compiled - TS/Angular 9<br/>
Internal E2E Lib - Don't mind this<br/>
<br/>
<b>Notes</b><br/>
SCSS files uses module import. How to achieve without symlink?<br/>
  - web-app-edit now uses web-lib-angular as symlink.<br/>
  - web-app-prime now uses web-lib-angular as symlink.<br/>
We now copy all non-generated interfaces with webpack into the dist to complement the auto-grenerated ones.<br/>
Types path is nested with its own package name when generating typings. Maybe because of rootDir?<br/>
  - Causes long ugly path in package.json.<br/>
web-app-wui needs to resolve web-lib-core/web-lib-common/web-lib-angular-js in javascript files<br/>
<br/>
Our goal is to have all dep in the root package.json, but as long as we have to generations of angular it felt cleaner to devide them.<br/>
<br/>
<b>Disclaimer</b>
Just some background. This repo is old and has A LOT of legacy and weird things. Before I joined 1.5 year ago it was barely any TS, it was built in a bad way with gulp and we only used Angular 1.5. And it wasn't a monorepo.<br/>
Last summer I converted everything to a monorepo and created/crafted all the build tools. I did not have enough deep knowledge about TS/Compilers/etc. to do a optimal implementation, obviously. But I did manage to get everything to work after all.<br/>
<br/>

