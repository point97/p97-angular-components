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
        templateUrl: BASE_URL+'datetime/templates/'+TEMPLATE_THEME+'/datetime.html',
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
                    if(dateObj === null || isNaN(dateObj)){
                        scope.errors.push('Invalid format.');
                    }

                    if(scope.value.length === 0){
                        scope.errors.push('This field is required');
                    }
                } else {
                    if(scope.value.length > 0 && (dateObj === null  || dateObj === NaN)) {
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
        templateUrl: BASE_URL+'number/templates/'+TEMPLATE_THEME+'/number.html',
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

                if (typeof scope.value !== 'number' && options.required && options.required === true) {
                    scope.errors.push('input must be a number');
                    return false;
                }

                if (typeof scope.value !== 'number' && (!options.required || options.required === false)) {
                    scope.errors.push('input must be a number');
                    return false;
                }

                if (options.min && (typeof options.min === 'number')) {
                    if (scope.value < options.min){
                        scope.errors.push('value must not be less than ' + options.min);
                    }
                }

                if (options.max && typeof(options.max === 'number')) {
                    if (scope.value > options.max){
                        scope.errors.push('value must not be more than ' + options.max);
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
        templateUrl: BASE_URL+'textarea/templates/'+TEMPLATE_THEME+'/textarea.html',
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
                    var max_count = options.max_count || 500;
                    if (scope.word_count > max_count) {
                        scope.errors.push('You can have up to '+max_count+' words. You currently have ' + scope.word_count);
                    }
                    else if (scope.word_count > options.max_word){
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
                var word_count;
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
        templateUrl: BASE_URL+'yes-no/templates/'+TEMPLATE_THEME+'/yes-no.html',
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
            if (!scope.question) return;
            var options = scope.question.options;
            scope.errors = [];

            if (scope.question.choices.length === 1) scope.value = scope.question.choices[0].value;
            
            // This is availible in the main controller.
            scope.internalControl = scope.control || {};
            scope.internalControl.validate_answer = function(){
                scope.errors = [];

                if (options.required && options.required === true) {
                    if (scope.value === null) {
                        scope.errors.push('This field is required')
                    }
                }
            },

            scope.internalControl.clean_answer = function(){

                if (scope.value === null){
                    scope.value = false;
                }
            }

        }
    } // end return 
})




angular.module('p97.questionTypes')
  .directive('text', function(){
    
        return {
            templateUrl: BASE_URL+'textarea/templates/'+TEMPLATE_THEME+'/textarea.html',
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
                        var max_count = options.max_count || 20;
                        if (scope.word_count > max_count) {
                            scope.errors.push('You can have up to '+max_count+' words. You currently have ' + scope.word_count);
                        }
                        else if (scope.word_count > options.max_word){
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
                    var word_count;
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