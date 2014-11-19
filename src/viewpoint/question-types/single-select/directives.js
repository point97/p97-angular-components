angular.module('p97.questionTypes')
  .directive('singleSelect', function($http, $templateCache, $compile){
    return {
        template: '',
        restrict: 'EA',

        // Scope should always look like this in all question types.
        scope: {
            question: '=', 
            value: '=',
            control: '='
        },
        link: function(scope, element, attrs) {

            scope.getContentUrl = function() {
                if(scope.question.options.templateUrl)
                    return BASE_URL+'single-select/templates/'+scope.question.options.templateUrl+'.html';
                else
                    return BASE_URL+'single-select/templates/ionic/drop-down.html';
            }

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

                if (options.default) {

                }

                return (scope.errors.length === 0);
            }

            scope.internalControl.clean_answer = function(){

            }

            // Compile the template into the directive's scope.
            $http.get(scope.getContentUrl(), { cache: $templateCache }).success(function(response) {
                var contents = element.html(response).contents();
                $compile(contents)(scope);
            });

        }
    } // end return 
})


