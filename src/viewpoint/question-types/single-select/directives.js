angular.module('p97.questionTypes')
  .directive('singleSelect', ['$http', '$templateCache', '$compile', '$injector', '$sce', function($http, $templateCache, $compile, $injector, $sce){
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
            scope.localChoices = angular.copy(scope.question.choices); // This creates a deep copy
            scope.obj = {'otherValue': null}

            scope.getContentUrl = function() {
                if(scope.question.options.templateUrl)
                    return BASE_URL+'single-select/templates/'+scope.question.options.templateUrl+'.html';
                else
                    return BASE_URL+'single-select/templates/ionic/checkbox-single.html';
            }

            scope.renderHtml = function(htmlCode) {
                return $sce.trustAsHtml(htmlCode);
            };

            if (!scope.question) return;

            if (scope.question.choices.length === 1) scope.value = scope.question.choices[0].value;

            if (options.allow_other > 0) {
                var otherChoice = { 'verbose': 'Other', 'value': 'other' }
                scope.localChoices.push(otherChoice);
            }

            //only checks a single choice - will unselect previous
            scope.changeSelected = function(choice) {
                _.each(scope.localChoices, function(i) {
                    if (i !== choice) {
                        i.checked = false;
                    } else {
                        if (i.checked === true) {
                            scope.inputValue = i.value;
                        } else {
                            (scope.inputValue = "")
                        }
                    }
                });
            };

            //if previousAnswer exists - check it upon return to the question
            scope.checkPreviousAnswer = function() {

                if (scope.value && scope.value !== "") {
                    choiceValues = _.pluck(scope.localChoices, "value");

                    //user responses not one of the default values - it must be an 'other' answer
                    if (!_.contains(choiceValues, scope.value)) {
                        //append previously saved 'Other' answer to question.choices
                        var addOther = { 'verbose': 'User Entered: '+scope.value, 'value': scope.value }
                        scope.localChoices.splice(scope.localChoices.length -1, 0, addOther);
                    }
                    scope.inputValue = scope.value;
                    
                    //find value and toggle choice as checked
                    var choice = _.find(scope.localChoices, {value: scope.inputValue});
                    choice.checked = true;
                }
            };
            
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

            //show Other Input in Modal on click
            scope.otherInputModal = function() {
                var otherInputPopup = $ionicPopup.show({
                  template: '<input type="text" ng-model="obj.otherValue">',
                  title: 'Other Option',
                  scope: scope,
                  subTitle: 'Please enter your input below',
                  buttons: [
                    { 
                      text: 'Cancel',
                      onTap: function(e) {
                        scope.cancelOther();
                      } 
                    },
                    {
                      text: '<b>Confirm</b>',
                      type: 'button-positive',
                      onTap: function(e) {
                          if (scope.otherValueCheck() == false) {
                            return false;
                          };

                          _.each(scope.localChoices, function (i) {
                            if ((i.verbose.substring(0, 13)) === 'User Entered:') {
                                scope.localChoices = _.reject(scope.localChoices, i)
                                }
                                return scope.localChoices;
                            });

                          var newChoice = { 'verbose': 'User Entered: '+scope.obj.otherValue, 'value': scope.obj.otherValue, 'checked': true};
                          //inserts newChoice into question.choices in front of 'Other'
                          scope.localChoices.splice(scope.localChoices.length -1, 0, newChoice);
                          scope.localChoices[scope.localChoices.length - 1].checked = false;
                          scope.inputValue = scope.obj.otherValue; 
                          scope.obj.otherValue = '';
                      }
                    }
                  ]
                });
            }

            // Compile the template into the directive's scope.
            $http.get(scope.getContentUrl(), { cache: $templateCache }).success(function(response) {
                var contents = element.html(response).contents();
                $compile(contents)(scope);
            });

            scope.$watch('inputValue', function (newValue) {
                if (newValue === 'other') {
                    scope.otherInputModal();
                } else {
                    scope.value = newValue;
                }
            });

            scope.otherValueCheck = function () {

                if (scope.obj.otherValue.length > 0) {

                    localContains = (_.some(scope.localChoices, function(i) {
                        return i.value == scope.obj.otherValue
                    }))
                    
                    if (localContains) {
                        ($ionicPopup ? $ionicPopup.alert({
                                            title: 'Duplicate Entries',
                                            template: 'You have typed a duplicate answer. Please try again.'
                                        }) 
                                     :  alert('You have typed a duplicate answer. Please try again.')
                        );
                        scope.obj.otherValue = '';
                        scope.cancelOther();
                        return false;
                    }; //end contains duplicate

                    if (scope.obj.otherValue.length > scope.question.options.other_max_length) {
                        ($ionicPopup ? $ionicPopup.alert({
                                            title: 'Too long',
                                            template: 'You have typed an answer that is too long. Please try again.'
                                        }) 
                                     :  alert('You have typed an answer that is too long. Please try again.')
                        );
                        scope.obj.otherValue = '';
                        scope.cancelOther();
                        return false;
                    }; //end lengthy input

                    // if ($ionicPopup) {
                    //    var confirmPopup = $ionicPopup.confirm({
                    //         title: 'Are You Sure',
                    //         template: 'Are you sure you want this selection?'
                    //       });
                    //    confirmPopup.then(function(res) {
                    //        if (res) {
                    //           setValue();
                    //        } 
                    //    }); //end confirmPopup.then
                       
                    // } else {
                    //     var option = window.confirm("Are You Sure", "Are you sure you want this selection");
                    //     if (option == true) {
                    //         setValue();
                    //     }
                    // } //ends else statement
                }          
            }

            //used multiple times throughout directive - unchecks and removes 'other' value
            scope.cancelOther = function () {
                //unchecks 'other' on UI
                scope.localChoices[scope.localChoices.length - 1].checked = false; 
                scope.inputValue = '';
            };

            scope.checkPreviousAnswer();
        }
    } // end return 
}])



