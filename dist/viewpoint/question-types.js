// p97.question-types module definition. This must be called first in the gulpfile
angular.module('p97.questionTypes', []);

angular.module('p97.questionTypes')
  .directive( 'qtLoader', function ( $compile ) {
    return {
        restrict: 'E',
        scope: { questions: '=' },
        template: "<div class='row blocks'></div>",
        controller: function ( $scope, $element ) {

            $scope.addDirectives = function() {
                /*
                Dynamically inject the question type directives into the
                DOM and then compile with Angular.
                */
                _.each($scope.questions, function(q, i){
                    q.form = {};
                    if (typeof(q.value) === 'undefined') q.value = '';
                    var html = '<div '+q.type+' question="questions['+i+']" value="questions['+i+'].value" control="questions['+i+'].form" cid="questions['+i+'].answerCid"></div>';
                    var el = $compile(html)($scope);
                    $element.parent().append(el);
                });
            }
            $scope.addDirectives();
        }
    }
});

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
            if (!scope.question) return;
            var options = scope.question.options;
            
            scope.errors = [];
            
            // This is availible in the main controller.
            scope.internalControl = scope.control || {};
            scope.internalControl.validate_answer = function(){
                // 
                
                scope.errors = [];
                var format =  options.datejs_format || 'MM/dd/yyyy';
                var dateObj = Date.parseExact(scope.value, format)

                if (options.required === true){
                    // if required check for a valid date.
                    if(dateObj === null){
                        scope.errors.push('Invalid format.');
                    }

                    if(scope.value.length === 0){
                        scope.errors.push('This field is required');
                    }
                } else {
                    if(scope.value.length > 0 && dateObj === null){
                        scope.errors.push('Invalid format.');
                    }
                }

                return (scope.errors.length === 0);
            };

            scope.internalControl.clean_answer = function(){
                // Nothing to see here.
            };
            
        }
    };
});

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
                scope.value = parseFloat(scope.value, 10);
            };



        }
    }
});

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
            };

            scope.$watch('value', function(newValue){
                if (!newValue) return;
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
            if (!scope.question) return;
            var options = scope.question.options;
            scope.errors = [];
            
            // This is availible in the main controller.
            scope.internalControl = scope.control || {};
            scope.internalControl.validate_answer = function(){
                scope.errors = [];
                if (options.required && options.required === true){
                    if (scope.value === null) {
                        scope.errors.push('This field is required');
                    }
                }
            }

            scope.internalControl.clean_answer = function(){
                // Nothing to see here.
                if (scope.value === null){
                    scope.value = false;
                }
            };
        }
    }
});


angular.module('p97.questionTypes')
  .directive('singleSelect', function(){
    return {
        templateUrl: BASE_URL+'single-select/templates/single-select.html',
        restrict: 'EA',

        // Scope should always look like this in all question types.
        scope: {
            question: '=', 
            value: '=',
            control: '='
        },
        link: function(scope, element, attrs) {
            if (scope.question.choices.length === 1) scope.value = scope.question.choices[0].value;
            // This is availible in the main controller.
            scope.internalControl = scope.control || {};
            scope.internalControl.validate_answer = function(){
                
                return true;
            },

            scope.internalControl.clean_answer = function(){
            }

        }
    } // end return 
})

angular.module('p97.questionTypes')
  .directive('text', function(){
    return {
        templateUrl: BASE_URL+'text/templates/text.html',
        restrict: 'EA',

        // Scope should always look like this in all question types.
        scope: {
            question: '=', 
            value: '=',
            control: '='
        },
        link: function(scope, element, attrs) {
            if (scope.question.choices.length === 1) scope.value = scope.question.choices[0].value;
            // This is availible in the main controller.
            scope.internalControl = scope.control || {};
            scope.internalControl.validate_answer = function(){
                return true;
            },

            scope.internalControl.clean_answer = function(){
                // Nothing to see here.
            }

            // scope.$watch('value', function(newVal){
            //     scope.internalControl.isDirty = true;
            // })

        }
    } // end return 
})