'use strict'

var gulp = require('gulp');
var rename = require('gulp-rename');
var uglify = require('gulp-uglify');

var DEST = 'question-types.js';

gulp.task('default', function() {
    return gulp.src(['src/question-types/number/*.js',
                     'src/question-types/yes-no/*.js',
                     'src/question-types/textarea/*.js',
                     'src/question-types/datetime/*.js'])
   
    // This will output the non-minified version
    .pipe(concat('question-types.js'))
    .pip(gulp.dest(DEST))
    // This will minify and rename to foo.min.js
    .pipe(uglify())
    .pipe(rename({ extname: '.min.js' }))
    .pipe(gulp.dest(DEST));
});