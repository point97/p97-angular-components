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
            var options;

            isNumber = function (x) {
                if (x === "") {
                    return false;
                };
                
                return !isNaN(x);
            }

            scope.setBlock = function(){
                options = scope.question.options;
                scope.errors = [];
                scope.value = scope.question.value
                scope.dummyValue = scope.value;
            }
            scope.setBlock();
            
            scope.getContentUrl = function() {
                if(scope.question.options.widget)
                    return BASE_TEMPLATE_URL+'number/templates/'+scope.question.options.widget+'.html';
                else
                    return BASE_TEMPLATE_URL+'number/templates/'+platform+'/number.html';
            }

            scope.renderHtml = function(htmlCode) {
                return $sce.trustAsHtml(htmlCode);
            };
            
            // This is availible in the main controller.
            scope.internalControl = scope.control || {};
            
            scope.internalControl.validate_answer = function(){
                scope.errors = []

            
                if ((!isNumber(scope.value) || scope.value == null) && options.required && options.required === true) {
                    scope.errors.push('input must be a number');
                    return false;
                }

                if (scope.value !== null && scope.value !== undefined) {

                    if (scope.value !== "" && !isNumber(scope.value) && (!options.required || options.required === false)) {
                        scope.errors.push('input must be a number');
                        return false;
                    }

                    if (options.min && isNumber(options.min)) {
                        if (scope.value < options.min){
                            scope.errors.push('value must not be less than ' + options.min);
                        }
                    }

                    if (options.max && isNumber(options.max)) {
                        if (scope.value > options.max){
                            scope.errors.push('value must not be more than ' + options.max);
                        }
                    }
                }

                return (scope.errors.length === 0);
            };

            scope.internalControl.clean_answer = function(){
                
            };


            scope.$watch('dummyValue', function(newValue){
                if (isNumber(newValue)) {
                    scope.value = parseFloat(newValue);
                } else if (newValue) {
                    scope.value = newValue;
                } else {
                    scope.value = "";
                }
            });

            // Compile the template into the directive's scope.
            $http.get(scope.getContentUrl(), { cache: $templateCache }).success(function(response) {
                var contents = element.html(response).contents();
                $compile(contents)(scope);
            });

            scope.$on('reset-block', function(event){
                /*
                Listens for the reset-block event fired by the map-form whenever the user 
                gets to the intro or end page of the map-form. 
                This is necessary becuase the map-form do not reloead that Controller
                and qt-loader.
                */
                console.log('[number] reset-block');
                scope.setBlock();
            });

        }
    }
}]);