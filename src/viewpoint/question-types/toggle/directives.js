angular.module('p97.questionTypes')  
.directive('toggle', ['$http', '$templateCache', '$compile', '$sce', function($http, $templateCache, $compile, $sce){  


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

            scope.renderHtml = function(htmlCode) {
                return $sce.trustAsHtml(htmlCode);
            };

            if (!scope.question) return;
            var options = scope.question.options;
            scope.errors = [];
            
            // Load intial data
            if (typeof(scope.question.value) !== 'undefined'){
                scope.localValue = scope.question.value;
            }
            
            // This is availible in the main controller.
            scope.internalControl = scope.control || {};
            scope.internalControl.validate_answer = function(){
                if (scope.value === scope.question.options.positiveValue
                    || scope.value === scope.question.options.negativeValue) {
                    return true;
                }
            }

            scope.internalControl.clean_answer = function(){
                // Nothing to see here.
                if (scope.value === null){
                    scope.value = false;
                }
            }

            // scope.showPositiveLabel = function() {
            //     if (scope.value === scope.question.choices[0].positiveValue){ 
            //         return true;
            //     } else`uu {
            //         return false;
            //     };
            // };

            scope.$watch('localValue', function(newValue){
                if (typeof(newValue) === 'undefined') return;
                if (newValue === true){
                    scope.value = scope.question.options.positiveValue || true;
                } else {
                    scope.value = scope.question.options.negativeValue || false;
                }
                console.log(scope.value)
            })

            // Compile the template into the directive's scope.
            $http.get(scope.getContentUrl(), { cache: $templateCache }).success(function(response) {
                var contents = element.html(response).contents();
                $compile(contents)(scope);
            });
        }
    }
}]);
