// p97.question-types module definition. This must be called first in the gulpfile
angular.module('p97.questionTypes', []);
// datetime controllers.js
// datetime directives.js

angular.module('p97.questionTypes')
  .directive('datetime', function(){  // question-type directives should be the nameof the question type as defined in the Viewpoint API.

    return {
        templateUrl: BASE_URL+'datetime/templates/datetime.html',
        restrict: 'EA',

        // Scope should always look like this in all question types.
        scope: {
            question: '=', 
            value: '=',
            control: '='
        },
        link: function(scope, element, attrs) {
            console.log("I made it to datetime link function");
            if (!scope.question) return;
            var options = scope.question.options;
            
            scope.errors = [];
            
            // This is availible in the main controller.
            scope.internalControl = scope.control || {};
            scope.internalControl.validate_answer = function(){
                // 
                scope.errors = [];
                var dateObj = Date.parseExact(scope.value, options.datejs_format)

                // if required check for a valid date.

                if (options.required && options.required === true) {
                    if(!dateObj){
                        scope.errors.push('A date and time is required.');
                    }
                }

                // if (options.max && typeof(options.max === 'number')) {
                //     if (scope.value > options.max){
                //         scope.errors.push('value must not be more than ' + options.max);
                //     }
                // }

                // if (options.required && options.required === true) {
                //     if (typeof(scope.value) !== 'number'){
                //         scope.errors.push('A number is required.');
                //     }
                // }

                return (scope.errors.length === 0);
            };

            scope.internalControl.clean_answer = function(){
                // Nothing to see here.
                console.log('in clean_answer')
            };
            
        }
    };
});
// number controllers.js
// number directives.js

angular.module('p97.questionTypes')  // All p97 components should be under p97.
  .directive('number', function(){  // question-type directives should be the nameof the question type as defined in the Viewpoint API.


    return {
        templateUrl: BASE_URL+'number/templates/number.html',
        restrict: 'EA',

        // Scope should always look like this in all question types.
        scope: {
            question: '=', 
            value: '=',
            control: '='
        },
        link: function(scope, element, attrs) {
            if (!scope.question) return;
            var options = scope.question.options;
            
            scope.errors = [];
            
            // This is availible in the main controller.
            scope.internalControl = scope.control || {};
            
            scope.internalControl.validate_answer = function(){
                scope.errors = []
                if (options.min && typeof(options.min === 'number')) {
                    if (scope.value < options.min){
                        scope.errors.push('value must not be less than ' + options.min);
                    }
                }

                if (options.max && typeof(options.max === 'number')) {
                    if (scope.value > options.max){
                        scope.errors.push('value must not be more than ' + options.max);
                    }
                }

                if (options.required && options.required === true) {
                    if (typeof(scope.value) !== 'number'){
                        scope.errors.push('A number is required.');
                    }
                }

                return (scope.errors.length === 0);
            };

            scope.internalControl.clean_answer = function(){
                // Nothing to see here.
                console.log('in clean_answer')
            };



        }
    }
});
// textare controllers.js
// textarea directives.js

angular.module('p97.questionTypes')  // All p97 components should be under p97.
  .directive('textarea', function(){  // question-type directives should be the nameof the question type as defined in the Viewpoint API.


    return {
        templateUrl: BASE_URL+'textarea/templates/textarea.html',
        restrict: 'EA',

        // Scope should always look like this in all question types.
        scope: {
            question: '=', 
            value: '=',
            control: '='
        },
        link: function(scope, element, attrs) {
            
            console.log("I made it to textarea link function");
            if (!scope.question) return;
            var options = scope.question.options;
            scope.errors = [];
            scope.char_count = 0;
            scope.word_count = 0;

            // This is availible in the main controller.
            scope.internalControl = scope.control || {};
            scope.internalControl.validate_answer = function(){
                // 
                scope.errors = [];
                
                if (scope.value === null) scope.value = ''; //Convert to empty string to make processing easier.

               
                if (options.min_word && typeof(options.min_word === 'number')) {                 
                    if (scope.word_count < options.min_word){
                        scope.errors.push('You must have at least '+options.min_word+' words. You have ' + scope.word_count);
                    }
                }

                if (options.max_word && typeof(options.max_word === 'number')) {
                    
                    if (scope.word_count > options.max_word){
                        scope.errors.push('You can only have ' + options.max_word + ' words. You have ' + scope.word_count);
                    }
                }

                // Char counts (only happens is min_word or max_word are not defined.)
                if (!options.min_word && options.min_char && typeof(options.min_char === 'number')){
                    if (scope.char_count < options.min_char){
                        scope.errors.push('You must have at least '+options.min_char+' characters. You have ' + scope.char_count);
                    }
                }
                if (!options.max_word && options.max_char && typeof(options.max_char === 'number')){
                    if (scope.char_count > options.max_char){
                        scope.errors.push('You can only have ' + options.max_char + ' characters. You have ' + scope.char_count);
                    }
                }

                return (scope.errors.length === 0);
            };


            scope.internalControl.clean_answer = function(){
                // Nothing to see here.
                console.log('in clean_answer');
            };

            scope.$watch('value', function(newValue){
                if (newValue === null) return;
                var char_count = newValue.length;
                if (char_count === 0){
                    word_count = 0;
                } else {
                    word_count = scope.value.split(' ').length || 0;
                }
                scope.char_count = char_count;
                scope.word_count = word_count;

            });



        }
    }
});

// yes-no controllers.js
// yes-no controllers.js

angular.module('p97.questionTypes')  // All p97 components should be under p97.
  .directive('yesNo', function(){  // question-type directives should be the nameof the question type as defined in the Viewpoint API.


    return {
        templateUrl: BASE_URL+'yes-no/templates/yes-no.html',
        restrict: 'EA',

        // Scope should always look like this in all question types.
        scope: {
            question: '=', 
            value: '=',
            control: '='
        },
        link: function(scope, element, attrs) {
            console.log("I made it to yes-no link function");
            if (!scope.question) return;
            var options = scope.question.options;
            scope.errors = [];
            
            // This is availible in the main controller.
            scope.internalControl = scope.control || {};
            scope.internalControl.validate_answer = function(){
                scope.errors = [];
                if (options.required && options.required === true){
                    console.log(scope.value)
                    if (scope.value === null) {
                        scope.errors.push('This field is required');
                    }
                }
            }

            scope.internalControl.clean_answer = function(){
                // Nothing to see here.
                console.log('in yesNo clean_answer');
                if (scope.value === null){
                    scope.value = false;
                }
            };
        }
    }
});
