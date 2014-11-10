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


