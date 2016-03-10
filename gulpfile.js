const gulp = require('gulp'),
    clean = require('gulp-clean'),
    install = require('gulp-install'),
    babel = require('gulp-babel'),
    packager = require('electron-packager'),
    runElectron = require("gulp-run-electron"),
    eslint = require('gulp-eslint'),
    appdmg = require('gulp-appdmg'),
    fs = require('fs');

const packageData = JSON.parse(fs.readFileSync('./package.json'));
const buildDir = 'package'
const outDir = '_packages'

gulp.task('clean', () => {
  return gulp.src(buildDir, {read: false, allowEmpty: true})
    .pipe(clean({force: true}));
});

gulp.task('copy-app', () => {
  return gulp.src(['app/**/*', 'images/**/*', 'main.js', 'package.json', 'waffle.png'], {base: '.'})
    .pipe(gulp.dest(buildDir));
});

gulp.task('install', () => {
  return gulp.src(`./${buildDir}/package.json`)
    .pipe(install({production: true}));
});

gulp.task('precompile', () => {
  return gulp.src(`./${buildDir}/**/*.js`)
          .pipe(babel({
              presets: ['es2015']
          }))
          .pipe(gulp.dest(`./${buildDir}`))
});

gulp.task('run', () => {
  gulp.src(`./${buildDir}`)
  	.pipe(runElectron());
});

gulp.task('package', () => {
  const options = {
         dir: `./${buildDir}`,
         platform: "darwin",
         arch: "x64",
         icon: "./images/icon.icns",
         out: `./${outDir}`,
         overwrite: true,
         asar: true,
         "app-version": packageData.version
     };
  packager(options, function done (err, appPath) {
         if(err) { return console.log(err); }
         return console.log('App created: ' + appPath);
  });
});

gulp.task('lint', function () {
    return gulp.src(['./app/**/*.js', 'main.js', '!*/node_modules/**'])
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(eslint.failAfterError());
});

gulp.task('release', function() {
  const data = {
    "title": `${packageData.name}`,
    "background": "./waffle.png",
    "icon-size": 80,
    "contents": [
      { "x": 25, "y": 125, "type": "link", "path": "/Applications" },
      { "x": 225, "y": 125, "type": "file", "path": `../${outDir}/${packageData.name}-darwin-x64/${packageData.name}.app` }
    ]
  };
  const outputFilename = `./${buildDir}/appPackage.json`;

  fs.writeFile(`${outputFilename}`, JSON.stringify(data, null, 4), function(err) {
    if(err) {
      return console.log(err);
    } else {
      console.log("JSON saved to " + outputFilename);
      return gulp.src(['*'])
        .pipe(appdmg({
          source: `${outputFilename}`,
          target: `./${outDir}/${packageData.name}-darwin-x64/${packageData.name}-v${packageData.version}.dmg`
        }));
    }
  });
});

gulp.task('watch', () => {
    gulp.watch(['./app/**/*', 'main.js'], ['start-dev']);
});

gulp.task('default', gulp.series('clean', 'lint', 'copy-app', 'install', 'precompile', 'package'));
gulp.task('start-dev', gulp.series('clean', 'lint', 'copy-app', 'install', 'precompile', 'run'));
gulp.task('start-dev-no-lint', gulp.series('clean', 'copy-app', 'install', 'precompile', 'run'));
gulp.task('lint', gulp.series('clean', 'lint'));
