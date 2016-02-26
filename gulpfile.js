const gulp = require('gulp'),
    clean = require('gulp-clean'),
    install = require('gulp-install'),
    babel = require('gulp-babel'),
    packager = require('electron-packager'),
    runElectron = require("gulp-run-electron"),
    eslint = require('gulp-eslint');

gulp.task('clean', () => {
  return gulp.src('package', {read: false})
    .pipe(clean({force: true}));
});

gulp.task('copy-app', ['clean'], () => {
  return gulp.src(['app/**/*', 'images/**/*', 'main.js', 'package.json'], {base: '.'})
    .pipe(gulp.dest('package'));
});

gulp.task('install', ['copy-app'], () => {
  return gulp.src('./package/package.json')
    .pipe(install({production: true}));
});

gulp.task('precompile', ['install'], () => {
  return gulp.src('./package/**/*.js')
          .pipe(babel({
              presets: ['es2015']
          }))
          .pipe(gulp.dest('./package'))
});

gulp.task('run', ['precompile'], () => {
  gulp.src("./package")
  	.pipe(runElectron());
});

gulp.task('package', ['precompile'], () => {
  const options = {
         dir: "./package",
         platform: "darwin",
         arch: "x64",
         icon: "./images/icon.icns",
         out: "./_packages",
         overwrite: true,
         asar: true,
         "app-version": "0.1.0"
     };
  packager(options, function done (err, appPath) {
         if(err) { return console.log(err); }
         console.log('App created: ' + appPath);
        gulp.src('package', {read: false})
           .pipe(clean({force: true}));
  });
});

gulp.task('lint', ['precompile'], function () {
    return gulp.src(['**/*.js','!node_modules/**'])
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(eslint.failAfterError());
});

gulp.task('watch', () => {
    gulp.watch(['./app/**/*', 'main.js'], ['start-dev']);
});

gulp.task('default', ['clean', 'copy-app', 'install', 'precompile', 'lint', 'package']);
gulp.task('start-dev', ['clean', 'copy-app', 'install', 'precompile', 'lint', 'run']);
