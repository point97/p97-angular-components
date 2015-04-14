angular.module('p97.questionTypes')
  .directive('date', ['$http', '$templateCache', '$compile', '$sce', function($http, $templateCache, $compile, $sce){  // question-type directives should be the nameof the question type as defined in the Viewpoint API.

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
            var options = angular.copy(scope.question.options);

            /*
              see possible language translations options in URL below
              https://github.com/amsul/pickadate.js/tree/3.5.5/lib/translations
              use those to help fill out datePickerOptions
            */
            scope.datePickerOptions = options.settings;

            if (options.initial && options.format !== 'yyyy') {
                scope.selectedDate = new Date(options.initial[0], options.initial[1] - 1, options.initial[2]);
            }
                 

            //validates years between 1900-2100
            //we can expanded if needed
            var regYear = /^(19|20)\d{2}$/;

            scope.errors = [];

            scope.getContentUrl = function() {
                if(scope.question.options.widget)
                    return BASE_TEMPLATE_URL+'date/templates/'+scope.question.options.widget+'.html';
                else
                    return BASE_TEMPLATE_URL+'date/templates/'+platform+'/date.html';
            }    

            scope.renderHtml = function(htmlCode) {
                return $sce.trustAsHtml(htmlCode);
            };     

            // This is availible in the main controller.
            scope.internalControl = scope.control || {};
            scope.internalControl.validate_answer = function(){
                
                scope.errors = [];

                var format =  options.format;

                convertToDate = function (value) {
                    return new Date(value)
                };

                if (options && options.required === true) {
                    if (scope.value == null || scope.value == "" || scope.value == undefined) {
                        scope.errors.push('Invalid date format')
                        return false;
                    }
                }

                if (format !== 'yyyy') {
                    if (scope.value !== null || scope.value !== "")  {
                        if (scope.value == undefined) {
                            scope.errors.push('Invalid date format')
                            return false; 
                        }

                        if (options.min) {
                            if (convertToDate(scope.value) < convertToDate(options.min)) {
                                scope.errors.push('Your selected date is too low')
                            }
                        }

                        if (options.max) {
                            if (convertToDate(scope.value) > convertToDate(options.max)) {
                                scope.errors.push('Your selected date is too high')
                            }
                        }
                    }
                }

                    
                else if (scope.value !== null && scope.value !== undefined && scope.value.length > 0) {

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