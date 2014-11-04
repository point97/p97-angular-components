angular.module('p97.questionTypes')
  .directive('text', function(){
    return {
        templateUrl: BASE_URL+'text/templates/'+THEME+'/text.html',
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
        }
    } // end return 
})