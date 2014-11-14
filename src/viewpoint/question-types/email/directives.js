var reg = 
angular.module('p97.questionTypes')  // All p97 components should be under p97.
  .directive('email', function($http, $templateCache, $compile){  // question-type directives should be the nameof the question type as defined in the Viewpoint API.


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
                    return BASE_URL+'email/templates/email/'+scope.question.options.templateUrl+'.html';
                else
                    return BASE_URL+'email/templates/ionic/email.html';
            }
            
            if (!scope.question) return;
            var options = scope.question.options;
            
            scope.errors = [];
            
            // This is availible in the main controller.
            scope.internalControl = scope.control || {};
            
            scope.internalControl.validate_answer = function(){
                scope.errors = []

                var reg = /^[_a-z0-9-]+(\.[_a-z0-9-]+)*@[a-z0-9-]+(\.[a-z0-9-]+)*(\.[a-z]{2,4})$/;
                
                if (!reg.test(scope.value) && options.required && options.required === true) {
                    scope.errors.push('input must be a valid email');
                    return false;
                }

                if (!reg.test(scope.value) && (!options.required || options.required === false)) {
                    scope.errors.push('input must be a valid email');
                    return false;
                }

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
});