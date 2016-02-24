var gulp = require('gulp'),
    clean = require('gulp-clean'),
    install = require('gulp-install'),
    babel = require('gulp-babel'),
    packager = require('electron-packager'),
    runElectron = require("gulp-run-electron");

gulp.task('clean', function() {
  return gulp.src('package', {read: false})
    .pipe(clean({force: true}));
});

gulp.task('copy-app', ['clean'], function() {
  return gulp.src(['app/**/*', 'images/**/*', 'main.js', 'package.json'], {base: '.'})
    .pipe(gulp.dest('package'));
});

gulp.task('install', ['copy-app'], function() {
  return gulp.src('./package/package.json')
    .pipe(install({production: true}));
});

gulp.task('precompile', ['install'], function() {
  return gulp.src('./package/**/*.js')
          .pipe(babel({
              presets: ['es2015']
          }))
          .pipe(gulp.dest('./package'))
});

gulp.task('run', ['precompile'], function() {
  gulp.src("./package")
  	.pipe(runElectron());
});

gulp.task('package', ['precompile'], function() {
  var options = {
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

gulp.task('watch', function() {
    gulp.watch(['./app/**/*', 'main.js'], ['start-dev']);
});

gulp.task('default', ['clean', 'copy-app', 'install', 'precompile', 'package']);
gulp.task('start-dev', ['clean', 'copy-app', 'install', 'precompile', 'run']);
