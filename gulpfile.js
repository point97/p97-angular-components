'use strict'

var gulp = require('gulp');
var rename = require('gulp-rename');
var uglify = require('gulp-uglify');
var concat = require('gulp-concat');
var clean = require('gulp-clean');

var _ =require('underscore');

var datejs =require('datejs');

var DEST = 'dist/';

var QUESTION_TYPES = [
                      'datetime',
                      'number', 
                      'textarea',
                      'yes-no',
                      'single-select',
                      'text',
                      'integer'
                     ]


gulp.task('question-types', function() {
    
    // var js_srcs = _.map(QUESTION_TYPES, function(type){
    //     return "example/app/scripts/p97-components/src/question-types/"+type+'/*.js';
    // });

    // Prepend the module.js file.
    // js_srcs.unshift("example/app/scripts/p97-components/src/question-types/module.js");
    gulp.src(DEST+'viewpoint/question-types', {read: false}).pipe(clean());

    var directive_srcs = _.map(QUESTION_TYPES, function(type){
        return "src/viewpoint/question-types/"+type+'/*.js';
    });
    
    // Prepend the module.js file.
    directive_srcs.unshift("src/viewpoint/question-types/qt-loader.js");

    console.log(directive_srcs)
    gulp.src(directive_srcs)
        .pipe(concat('question-types.js'))// This will output the non-minified version
        .pipe(gulp.dest(DEST + 'viewpoint'))

        .pipe(uglify())// This will output the minified version
        .pipe(rename({ extname: '.min.js' }))
        .pipe(gulp.dest(DEST + 'viewpoint'));


    // Copy the Ionic HMTL templates to dist/templates
    var ionic_templates_srcs = _.map(QUESTION_TYPES, function(type){
        return "src/viewpoint/question-types/"+type+'/templates/ionic/*.html';
    });

    console.log(ionic_templates_srcs);
    return gulp.src(ionic_templates_srcs)
        .pipe(gulp.dest(DEST+'viewpoint/templates/ionic'));

});

gulp.task('viewpoint', function() {
    gulp.src(DEST+'viewpoint/*.js', {read: false}).pipe(clean());
    
    return gulp.src(['src/viewpoint/*.js'])
   
    // This will output the non-minified version
    .pipe(concat('services.js'))
    .pipe(gulp.dest(DEST + 'viewpoint'))
    
    // This will minify and rename to foo.min.js
    .pipe(uglify())
    .pipe(rename({ extname: '.min.js' }))
    .pipe(gulp.dest(DEST + 'viewpoint'));

});


gulp.task('default', ['question-types', 'viewpoint'], function() {
    
});