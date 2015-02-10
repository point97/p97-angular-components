angular.module('p97.questionTypes')  // All p97 components should be under p97.
  .directive('number', ['$http', '$templateCache', '$compile', '$sce', function($http, $templateCache, $compile, $sce){  // question-type directives should be the nameof the question type as defined in the Viewpoint API.


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

            if (!scope.question) return;
            var options = scope.question.options;
            
            scope.errors = [];

            scope.getContentUrl = function() {
                if(scope.question.options.templateUrl)
                    return BASE_URL+'number/templates/'+scope.question.options.templateUrl+'.html';
                else
                    return BASE_URL+'number/templates/ionic/number.html';
            }

            scope.renderHtml = function(htmlCode) {
                return $sce.trustAsHtml(htmlCode);
            };  
                     
            // This is availible in the main controller.
            scope.internalControl = scope.control || {};
            
            scope.internalControl.validate_answer = function(){
                scope.errors = []

                if (typeof scope.value !== 'number' || isNaN(scope.value)) {
                    if (options.required && options.required === true) {
                        scope.errors.push('input must be an number');
                        return false;
                    }

                    if (scope.value !== "" && (!options.required || options.required === false)) {
                        scope.errors.push('input must be a number');
                        return false;
                    }

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

            scope.showDummyValue = function() {
                /*
                in ionic, number qType uses a hidden input to save responses. 
                From a purely UI standpoint - the shown input is a num/tel to display an appropriate keyboard.
                As a result, to display the previousValue - that value must be set to the dummy input
                */
                if ((scope.value) && scope.value !== "") {
                    scope.dummyValue = scope.value.toString();
                }
            };

            scope.internalControl.clean_answer = function(){
                scope.value = parseFloat(scope.value, 10);
            };

            scope.$watch('dummyValue', function(newValue){
                if (isInteger(newValue)) {
                    scope.value = parseInt(newValue);
                } else {
                scope.value =  "";
                }
            });

            // Compile the template into the directive's scope.
            $http.get(scope.getContentUrl(), { cache: $templateCache }).success(function(response) {
                var contents = element.html(response).contents();
                $compile(contents)(scope);
            });

        }
    }
}]);