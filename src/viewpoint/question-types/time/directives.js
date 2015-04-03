angular.module('p97.questionTypes')  // All p97 components should be under p97.
  .directive('time', ['$http', '$templateCache', '$compile', '$sce', function($http, $templateCache, $compile, $sce){  // question-type directives should be the nameof the question type as defined in the Viewpoint API.


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
            
            scope.getContentUrl = function() {
                if(scope.question.options.widget)
                    return BASE_TEMPLATE_URL+'time/templates/'+scope.question.options.widget+'.html';
                else
                    return BASE_TEMPLATE_URL+'time/templates/'+platform+'/time.html';
            }

            scope.renderHtml = function(htmlCode) {
                return $sce.trustAsHtml(htmlCode);
            };

            scope.getEpoch = function(initial) {

                if (options.initial !== undefined) {
                    var timeStr = initial.replace(/\D/g,'');
                    var hourStr = initial.substring(0,2);
                    var minutesStr = initial.substring(3,5);

                    if (options.format === 12 && hourStr !== '12' && initial.slice(-2) === "PM") {
                        return parseInt(hourStr) * 3600 + parseInt(minutesStr) * 60;
                    } else {
                        return parseInt(timeStr) * 36;
                    }
                }
            };


            scope.slots = {
                
                epochTime: scope.getEpoch(options.initial) || 0, 

                //12||24 hour clock
                format: options.format || 24,

                // minutes in 1||15 steps
                step: options.increments || 15
            };

            scope.getTime = function () {
                var decimalHours = scope.slots.epochTime/3600;
                var readableHours = Math.floor(decimalHours);
                var minutes = (decimalHours - readableHours) * 60;
                var twelveHourClock = readableHours - 12;

                doubleZero = function(minutes) {
                    if (minutes === 0) {
                        return "00";
                    } else {
                        return minutes;
                    }
                };

                if (scope.slots.format === 24) {
                    return readableHours + ":" + doubleZero(minutes);
                }

                else {
                    if (scope.slots.epochTime < 43200) {
                        if (readableHours === 0) {
                            return "12:" + doubleZero(minutes) + " AM";
                        } else {
                        return readableHours + ":" + doubleZero(minutes) + " AM";
                        }   
                    } else if (scope.slots.epochTime >= 43200 && scope.slots.epochTime < 46800) {
                        return "12:" + doubleZero(minutes) + " PM";
                    } else {
                        return twelveHourClock + ":" + doubleZero(minutes) + " PM";
                    }
                }
            };

            // This is availible in the main controller.
            scope.internalControl = scope.control || {};
            
            scope.internalControl.validate_answer = function(){
                scope.errors = []
                return (scope.errors.length === 0);
            };

            scope.internalControl.clean_answer = function(){
                
            };

            // Compile the template into the directive's scope.
            $http.get(scope.getContentUrl(), { cache: $templateCache }).success(function(response) {
                var contents = element.html(response).contents();
                $compile(contents)(scope);
            });

        }
    }
}]);