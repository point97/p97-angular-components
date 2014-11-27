angular.module('p97.questionTypes')
  .directive('multiSelect', function($http, $templateCache, $compile, $ionicPopup){
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

            var options = scope.question.options;
            var reg = /^[A-Za-z\d() _.,-]*$/;
            scope.showOtherInput = false;
            scope.choices_selected = 0;
            scope.errors = [];
            scope.valueArray = [];

            scope.getContentUrl = function() {
                if(scope.question.options.templateUrl)
                    return BASE_URL+'multi-select/templates/'+scope.question.options.templateUrl+'.html';
                else
                    return BASE_URL+'multi-select/templates/ionic/toggle-multi.html';
            }

            if (!scope.question) return;

            if (scope.question.choices.length === 1) scope.value = scope.question.choices[0].value;

            if (options.allow_other > 0) {
                var otherChoice = { 'verbose': 'Other', 'value': 'other' }
                scope.question.choices.push(otherChoice);
            }
            
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

                return scope.cleaned_value;
            }

            scope.toggleAnswers = function(choiceValue) {
                var index = scope.valueArray.indexOf(choiceValue);
                if (index > -1) {
                    scope.valueArray.splice(index, 1);
                }
                else {
                    scope.valueArray.push(choiceValue);
                }
                // Sort and update DOM display
                scope.valueArray.sort(function(a, b) {
                    return a - b
                });
                scope.value = scope.valueArray;
            };

            //notification confirmation for 'other' answer
            scope.otherValueBlur = function() {
                if (scope.otherValue.length > 0) {
                    var confirmPopup = $ionicPopup.confirm({
                        title: 'Are You Sure',
                        template: 'Are you sure you want this selection?'
                    });
                    confirmPopup.then(function(res) {
                        if (res) {
                           var newChoice = { 'verbose': 'User Entered: '+scope.otherValue, 'value': scope.otherValue, 'checked': true};

                           //inserts newChoice into question.choices in front of 'Other'
                           scope.question.choices.splice(scope.question.choices.length -1, 0, newChoice);

                           //removes 'other' item from valueArray and replaces it with user defined otherValue
                           scope.valueArray[scope.valueArray.indexOf('other')] = scope.otherValue;

                           //toggle off 'other' item
                           scope.question.choices[scope.question.choices.length - 1].checked = false;

                           scope.showOtherInput = false; 
                           scope.otherValue = '';
                        }
                    });
                }
            }

            scope.$watchCollection('valueArray', function(newValues, oldValues){
                if (!newValues) return;

                //watch  the number of choices selected within valueArray
                //useful for defining number of choices users are allow to select
                var choices_selected = newValues.length;
                scope.choices_selected = choices_selected;

                //show or hides text input depending on if valueArray contains an 'other' value
                if (_.contains(scope.valueArray, 'other')) {
                    scope.showOtherInput = true;
                } else {
                    scope.showOtherInput = false;
                }
            });

            // Compile the template into the directive's scope.
            $http.get(scope.getContentUrl(), { cache: $templateCache }).success(function(response) {
                var contents = element.html(response).contents();
                $compile(contents)(scope);
            });
        }
    } // end return 
})


