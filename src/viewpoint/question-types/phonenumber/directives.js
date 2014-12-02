angular.module('p97.questionTypes')
  .directive('phonenumber', function($http, $templateCache, $compile){  // question-type directives should be the nameof the question type as defined in the Viewpoint API.

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
                    return BASE_URL+'phonenumber/templates/'+scope.question.options.templateUrl+'.html';
                else
                    return BASE_URL+'phonenumber/templates/ionic/phonenumber.html';
            }

            if (!scope.question) return;
            var options = scope.question.options;
            
            scope.errors = [];
            
            //regex for North American phone numbers 
            //(US territories, Canada, Bermuda, and 17 Caribbean nations)
            var regNorthAmerica =/^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;

            //regex for International phone numbers 
            //Industry-standard notation specified by ITU-T E.123
            var regInternational = /^[0-9 ]+$/;
            
            // This is availible in the main controller.
            scope.internalControl = scope.control || {};
            scope.internalControl.validate_answer = function(){
                scope.errors = [];

                var format =  options.default || 'North America';

                if (options.required && options.required === true){
                    if (scope.value === null) {
                        scope.errors.push('This field is required');
                        return false;
                    }
                }

                if (options.format && options.format === 'North America') {
                    if (!regNorthAmerica.test(scope.value)) {
                        scope.errors.push('input must be a valid North America phonenumber')
                    }
                }

                if (options.format && options.format === 'International') {
                    if (!regInternational.test(scope.value)) {
                        scope.errors.push('input must be a valid International phonenumber')
                    }  
                }

                return (scope.errors.length === 0);
            }

            scope.internalControl.parse_phone = function() {
                
                if (options.format && options.format === 'North America' && regNorthAmerica.test(scope.value)) {
                    var phone = "+" + options.country + " " + scope.value.replace(regNorthAmerica, '$1 $2$3');
                    scope.parsed_array = phone.split(' ');
                } 

                if (options.format && options.format === 'International' && regInternational.test(scope.value)) {
                    var phone = "+" + options.country + " " + scope.value;
                    scope.parsed_array = phone.split(' ');
                }

                return scope.parsed_array;
            }

            scope.internalControl.clean_answer = function(){
                scope.internalControl.cleaned_value = scope.internalControl.parse_phone();
                return scope.internalControl.cleaned_value;
            }


            // Compile the template into the directive's scope.
            $http.get(scope.getContentUrl(), { cache: $templateCache }).success(function(response) {
                var contents = element.html(response).contents();
                $compile(contents)(scope);
            });
            
        }
    };
});