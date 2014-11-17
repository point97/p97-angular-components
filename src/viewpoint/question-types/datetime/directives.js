angular.module('p97.questionTypes')
  .directive('datetime', function($http, $templateCache, $compile){  // question-type directives should be the nameof the question type as defined in the Viewpoint API.

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
                    return BASE_URL+'datetime/templates/datetime/'+scope.question.options.templateUrl+'.html';
                else
                    return BASE_URL+'datetime/templates/ionic/datetime.html';
            }

            if (!scope.question) return;
            var options = scope.question.options;
            
            scope.errors = [];
            
            // This is availible in the main controller.
            scope.internalControl = scope.control || {};
            scope.internalControl.validate_answer = function(){
                // 
                
                scope.errors = [];
                var format =  options.datejs_format || 'MM/dd/yyyy HH:mm:ss';
                var dateTimeObj = Date.parseExact(scope.value, format)

                if (options.required === true){
                    // if required check for a valid date.
                    if(dateTimeObj === null || isNaN(dateTimeObj)){
                        scope.errors.push('Invalid format.');
                    }

                    if(scope.value.length === 0){
                        scope.errors.push('This field is required');
                    }
                } else {
                    if(scope.value.length > 0 && (dateTimeObj === null  || dateTimeObj === NaN)) {
                        scope.errors.push('Invalid format.');
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
});