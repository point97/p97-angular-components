angular.module('p97.questionTypes')
  .directive('multiSelect', function($http, $templateCache, $compile){
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
                    return BASE_URL+'multi-select/templates/'+scope.question.options.templateUrl+'.html';
                else
                    return BASE_URL+'multi-select/templates/ionic/drop-down-multi.html';
            }

            if (!scope.question) return;

            var options = scope.question.options;
            scope.showOtherInput = false;
            scope.choices_selected = 0;
            scope.errors = [];

            if (scope.question.choices.length === 1) scope.value = scope.question.choices[0].value;

            if (options.allow_other > 0) {
                var otherChoice = { 'verbose': 'Other', 'value': 'other' }
                scope.question.choices.push(otherChoice);
            }

            var reg = /^[A-Za-z\d() _.,-]*$/;
            
            // This is availible in the main controller.
            scope.internalControl = scope.control || {};
            scope.internalControl.validate_answer = function(){
                scope.errors = [];

                if (options.required && options.required === true) {
                    if (scope.value === null) {
                        scope.errors.push('This field is required')
                    }
                }

                if (!reg.test(scope.otherValue) || !reg.test(scope.value) || !reg.test(scope.clean)) {
                    scope.errors.push("Your 'Other' input is invalid. Please try again without using special characters or symbols")
                }

                if (scope.value === 'other') {
                    if (!scope.otherValue || scope.otherValue === null) {
                        scope.errors.push("You selected 'Other'. It cannot be blank. Please fill in a response or select another choice")
                    }
                }

                if (options.max_choice && typeof(options.max_choice === 'number')) {
                    if (scope.choices_selected > options.max_choice) {
                        scope.errors.push('You can have up to '+options.max_choice+' choices. You currently have ' + scope.choices_selected)
                    }
                }

                if (options.min_choice && typeof(options.min_choice === 'number')) {
                    if (scope.choices_selected < options.min_choice) {
                        scope.errors.push('You need at least '+options.min_choice+' choices. You currently have ' + scope.choices_selected)
                    }
                }

                return (scope.errors.length === 0);
            }

            scope.internalControl.clean_answer = function(){
                scope.cleaned_value = scope.value;
                if (scope.value === 'other') {
                    scope.cleaned_value = scope.otherValue;
                }
                return scope.cleaned_value;
            }

            scope.$watch('value', function(newValue){
                if (!newValue) return;
                var choices_selected = newValue.length;
                scope.choices_selected = choices_selected;
                if (_.contains(scope.value, 'other')) {
                    scope.showOtherInput = true;
                }

            });

            // Compile the template into the directive's scope.
            $http.get(scope.getContentUrl(), { cache: $templateCache }).success(function(response) {
                var contents = element.html(response).contents();
                $compile(contents)(scope);
            });

            scope.otherValueBlur = function () {
                if (scope.otherValue.length > 0) {
                    var res = window.confirm('Are you sure you want this input?')
                    if (res) {
                       var newChoice = { 'verbose': 'User Entered: '+scope.otherValue, 'value': scope.otherValue };
                       scope.question.choices.splice(scope.question.choices.length -1, 0, newChoice);
                       scope.value = _.initial(scope.value)
                       scope.value.push(scope.otherValue);
                       scope.showOtherInput = false; 
                       scope.otherValue = '';
                   }
                }
            }
        }
    } // end return 
})


