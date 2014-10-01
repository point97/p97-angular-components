'use strict'

var gulp = require('gulp');
var rename = require('gulp-rename');
var uglify = require('gulp-uglify');
var concat = require('gulp-concat');

var DEST = 'dist/';



gulp.task('question-types', function() {
    return gulp.src(['src/question-types/number/*.js',
                     'src/question-types/yes-no/*.js',
                     'src/question-types/textarea/*.js',
                     'src/question-types/datetime/*.js'])
   
    // This will output the non-minified version
    .pipe(concat('question-types.js'))
    .pipe(gulp.dest(DEST))
    // This will minify and rename to foo.min.js
    .pipe(uglify())
    .pipe(rename({ extname: '.min.js' }))
    .pipe(gulp.dest(DEST));
});

gulp.task('viewpoint2', function() {
    return gulp.src(['src/viewpoint2/*.js'])
   
    // This will output the non-minified version
    .pipe(concat('p97-components.js'))
    .pipe(gulp.dest(DEST))
    // This will minify and rename to foo.min.js
    .pipe(uglify())
    .pipe(rename({ extname: '.min.js' }))
    .pipe(gulp.dest(DEST));
});

gulp.task('default', ['question-types', 'viewpoint2'], function() {

});