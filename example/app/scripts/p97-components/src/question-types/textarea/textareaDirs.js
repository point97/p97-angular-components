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
            
            // This is availible in the main controller.
            scope.internalControl = scope.control || {};
            scope.internalControl.validate_answer = function(){
                // 
                scope.errors = [];
                var word_count = scope.value.split(' ').length || 0;
                var char_count = scope.value.length;
                
                if (options.min_word && typeof(options.min_word === 'number')) {                 
                    if (word_count < options.min_word){
                        scope.errors.push('You must have at least '+options.min_word+' words. You have ' + word_count);
                    }
                }

                if (options.max_word && typeof(options.max_word === 'number')) {
                    
                    if (word_count > options.max_word){
                        scope.errors.push('You can only have ' + options.max_word + ' words. You have ' + word_count);
                    }
                }

                // Char counts (only happens is min_word or max_word are not defined.)
                if (!options.min_word && options.min_char && typeof(options.min_char === 'number')){
                    if (char_count < options.min_char){
                        scope.errors.push('You must have at least '+options.min_char+' characters. You have ' + char_count);
                    }
                }
                if (!options.max_word && options.max_char && typeof(options.max_char === 'number')){
                    if (char_count > options.max_char){
                        scope.errors.push('You can only have ' + options.max_char + ' characters. You have ' + char_count);
                    }
                }

                return (scope.errors.length === 0);
            };


            scope.internalControl.clean_answer = function(){
                // Nothing to see here.
                console.log('in clean_answer');
            };



        }
    }
});
