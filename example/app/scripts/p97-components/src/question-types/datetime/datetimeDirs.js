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