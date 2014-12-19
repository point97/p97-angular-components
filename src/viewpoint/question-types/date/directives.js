angular.module('p97.questionTypes')
  .directive('date', ['$http', '$templateCache', '$compile', function($http, $templateCache, $compile){  // question-type directives should be the nameof the question type as defined in the Viewpoint API.

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
            
            //validates years between 1900-2100
            //we can expanded if needed
            var regYear = /^(19|20)\d{2}$/;

            scope.errors = [];

            scope.getContentUrl = function() {
                if(scope.question.options.templateUrl)
                    return BASE_URL+'date/templates/'+scope.question.options.templateUrl+'.html';
                else
                    return BASE_URL+'date/templates/ionic/date.html';
            }         

            // This is availible in the main controller.
            scope.internalControl = scope.control || {};
            scope.internalControl.validate_answer = function(){
                
                scope.errors = [];

                var format =  options.datejs_format || 'MM/dd/yyyy';

                if (options && options.required === true) {
                    if (scope.value == null || scope.value == "") {
                        scope.errors.push('This field is required')
                        return false;
                    }
                }

                if (scope.value !== null && scope.value !== undefined) {
                    // check for a valid date.
                    var dateObj = Date.parseExact(scope.value, format);
                    if (dateObj == null || isNaN(dateObj)) {
                        scope.errors.push('You date is in an invalid format')
                    }
                
                    if (format && format === 'yyyy') {
                        if (!regYear.test(scope.value)) {
                            scope.errors.push('Input must be a valid year')
                        }

                        if (options.min && regYear.test(options.min)) {
                            if (scope.value < options.min){
                                scope.errors.push('Year must not be lower than ' + options.min);
                            }
                        }

                        if (options.max && regYear.test(options.max)) {
                            if (scope.value > options.max){
                                scope.errors.push('Year must not be higher than ' + options.max);
                            }
                        }    
                    }
                }

                return (scope.errors.length === 0);
            };

            scope.internalControl.clean_answer = function(){
                // Nothing to see here.
            };

            // Compile the template into the directive's scope.
            $http.get(scope.getContentUrl(), { cache: $templateCache }).success(function(response) {
                var contents = element.html(response).contents();
                $compile(contents)(scope);
            });
            
        }
    };
}]);