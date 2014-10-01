'use strict'

var gulp = require('gulp');
var rename = require('gulp-rename');
var uglify = require('gulp-uglify');
var concat = require('gulp-concat');
var _ =require('underscore');

var DEST = 'dist/';

var QUESTION_TYPES = [
                      'datetime',
                      'number', 
                      'textarea',
                      'yes-no',
                     ]


gulp.task('question-types', function() {
    
    var js_srcs = _.map(QUESTION_TYPES, function(type){
        return "src/question-types/"+type+'/*.js';
    });

    gulp.src(js_srcs)
   
    // This will output the non-minified version
    .pipe(concat('question-types.js'))
    .pipe(gulp.dest(DEST))
    // This will minify and rename to foo.min.js
    .pipe(uglify())
    .pipe(rename({ extname: '.min.js' }))
    .pipe(gulp.dest(DEST));


    // Copy HMTL templates to dist/templates
    var templates_srcs = _.map(QUESTION_TYPES, function(type){
        return "src/question-types/"+type+'/templates/*.html';
    });

    gulp.src(templates_srcs)
    .pipe(gulp.dest(DEST+'/templates/'));


});

gulp.task('viewpoint2', function() {
    gulp.src(['src/viewpoint2/*.js'])
   
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