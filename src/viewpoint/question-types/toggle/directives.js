angular.module('p97.questionTypes')  
  .directive('toggle', ['$http', '$templateCache', '$compile', function($http, $templateCache, $compile){  


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
                    return BASE_URL+'toggle/templates/'+scope.question.options.templateUrl+'.html';
                else
                    return BASE_URL+'toggle/templates/ionic/toggle.html';
            }

            if (!scope.question) return;
            var options = scope.question.options;
            scope.errors = [];
            
            // This is availible in the main controller.
            scope.internalControl = scope.control || {};
            scope.internalControl.validate_answer = function(){

            }

            scope.internalControl.clean_answer = function(){
                // Nothing to see here.
                if (scope.value === null){
                    scope.value = false;
                }
            }

            scope.showPositiveLabel = function() {
                if (scope.value === scope.question.choices[0].positive_value){ 
                    return true;
                } else {
                    return false;
                };
            };

            // Compile the template into the directive's scope.
            $http.get(scope.getContentUrl(), { cache: $templateCache }).success(function(response) {
                var contents = element.html(response).contents();
                $compile(contents)(scope);
            });
        }
    }
}]);
