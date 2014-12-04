angular.module('p97.questionTypes')
  .directive('singleSelect', ['$http', '$templateCache', '$compile', '$injector', function($http, $templateCache, $compile, $injector){
    if ($injector.has('$ionicPopup')) {
        var $ionicPopup = $injector.get('$ionicPopup');
    }
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

            var reg = /^[A-Za-z\d() _.,-]*$/;
            var options = scope.question.options;
            scope.errors = [];

            scope.getContentUrl = function() {
                if(scope.question.options.templateUrl)
                    return BASE_URL+'single-select/templates/'+scope.question.options.templateUrl+'.html';
                else
                    return BASE_URL+'single-select/templates/ionic/drop-down-single.html';
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

                if (!reg.test(scope.value)) {
                    scope.errors.push("Your 'Other' input is invalid. Please try again without using special characters or symbols")
                }

                if (scope.inputValue === 'other') {
                    if (!scope.otherValue || scope.otherValue === null) {
                        scope.errors.push("You selected 'Other'. It cannot be blank. Please fill in a response or select another choice")
                    }
                }

                return (scope.errors.length === 0);
            }

            scope.internalControl.clean_answer = function(){
                //nothing to see here
            }

            scope.internalControl.unclean_answer = function() {
                //append previously saved 'Other' answer to question.choices
                choiceValues = _.pluck(scope.question.choices, "value");
                if (choiceValues.indexOf(scope.value) > -1) {
                    var addOther = { 'verbose': 'User Entered', 'value': scope.value }
                    scope.question.choices.splice(scope.question.choices.length -1, 0, addOther);
                }
                return scope.question.choices
            }

            // Compile the template into the directive's scope.
            $http.get(scope.getContentUrl(), { cache: $templateCache }).success(function(response) {
                var contents = element.html(response).contents();
                $compile(contents)(scope);
            });

            scope.$watch('inputValue', function (newValue) {
                if (newValue === 'other') {
                    scope.value = scope.otherValue;
                } else {
                    scope.value = newValue;
                }
            });

            scope.otherValueBlur = function () {

                setValue = function() {
                    var newChoice = { 'verbose': 'User Entered: '+scope.otherValue, 'value': scope.otherValue };
                    scope.question.choices.splice(scope.question.choices.length -1, 0, newChoice);
                    scope.inputValue = scope.otherValue; 
                    scope.otherValue = '';
                };

                if (scope.otherValue.length > 0) {
                    if (scope.otherValue.length > scope.question.options.other_max_length) {
                        ($ionicPopup ? $ionicPopup.alert({
                                            title: 'Too long',
                                            template: 'You have typed an answer that is too long. Please try again.'
                                        }) 
                                     :  alert('You have typed an answer that is too long. Please try again.')
                        );
                        return false;
                    }; //end lengthy input

                    if ($ionicPopup) {
                       var confirmPopup = $ionicPopup.confirm({
                            title: 'Are You Sure',
                            template: 'Are you sure you want this selection?'
                          });
                       confirmPopup.then(function(res) {
                           if (res) {
                              setValue();
                           } 
                       }); //end confirmPopup.then
                       
                    } else {
                        var option = window.confirm("Are You Sure", "Are you sure you want this selection");
                        if (option == true) {
                            setValue();
                        }
                    } //ends else statement
                }          
            }
        }
    } // end return 
}])



