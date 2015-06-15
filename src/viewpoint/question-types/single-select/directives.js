angular.module('p97.questionTypes')
  .directive('singleSelect', ['$http', '$templateCache', '$compile', '$injector', '$sce', '$formUtils', '$vpApi', function($http, $templateCache, $compile, $injector, $sce, $formUtils, $vpApi){
    if ($injector.has('$ionicPopup')) {
        var $ionicPopup = $injector.get('$ionicPopup');
    }

    if ($injector.has('$modal')) {
        var $modal = $injector.get('$modal');
    }
    return {
        template: '',
        restrict: 'EA',

        // Scope should always look like this in all question types.
        scope: {
            question: '=',
            value: '=',
            control: '=',
            current: '='
        },
        link: function(scope, element, attrs) {
            if (!scope.question) return;

            var reg = /^[A-Za-z\d() _.,-]*$/;
            var options = scope.question.options;


            scope.setBlock = function(){
                scope.errors = [];
                //if filter option exist, only show choices in group_value
                if (options.filter) {
                    if ($formUtils && $vpApi.db && scope.current) {
                        if(scope.current.form.forEachItem && scope.current.form.forEachItem.value != ""){
                            var answer = $formUtils.getAnswer(null, options.filter, scope.current.fsResp.id);
                            if (answer !== null) {
                                scope.localChoices = _.filter(scope.question.choices, function(item) {
                                    return item.group_value === scope.current.form.forEachItem.value
                                });
                            }
                        }else{
                            var answer = $formUtils.getAnswer(null, options.filter, scope.current.fsResp.id);
                            if (answer !== null) {
                                scope.localChoices = _.filter(scope.question.choices, function(item) {
                                    return item.group_value === answer.value
                                });
                            }
                        }

                    }else{
                        scope.localChoices = []
                    }
                }else{
                    scope.localChoices = angular.copy(scope.question.choices); // This creates a deep copy
                }

                scope.obj = {'otherValue': null}

                if (scope.question.choices.length === 1) scope.value = scope.question.choices[0].value;

                if (options.allow_other > 0) {
                    var otherChoice = { 'verbose': 'Other', 'value': 'other' }
                    scope.localChoices.push(otherChoice);
                }
            };
            scope.setBlock();

            scope.getContentUrl = function() {
                if(scope.question.options.widget)
                    return BASE_TEMPLATE_URL+'single-select/templates/'+scope.question.options.widget+'.html';
                else
                    return BASE_TEMPLATE_URL+'single-select/templates/'+platform+'/checkbox-single.html';
            }

            scope.renderHtml = function(htmlCode) {
                return $sce.trustAsHtml(htmlCode);
            };

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
                scope.value = scope.inputValue;
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
                //modal popup for hybrid/ionic
                if (platform === 'hybrid') {
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
                            scope.confirmModalOtherValue();
                          }
                        }
                      ]
                    });
                }

                //web - angular-strap modal
                if (platform === 'web') {
                    scope.myOtherModal = $modal({
                        scope: scope,
                        template: 'templates/web/partials/other-input-modal.html',
                        show: true
                    });
                };

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
                    scope.$emit("changed-value", {'changedVal': newValue || "", 'questionSlug': scope.question.slug});
                    scope.value = newValue;
                }
            });

            //confirmation function for otherInputModal
            scope.confirmModalOtherValue = function() {
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
            };

            //notification confirmation for 'other' answer
            scope.otherValueCheck = function() {
                scope.errorEmpty = false;
                scope.errorDuplicate = false;
                scope.errorLength = false;

                if (scope.obj.otherValue === null || scope.obj.otherValue === "") {
                    if (platform === 'hybrid'){
                        $ionicPopup.alert({
                            title: 'No Entry Made',
                            template: 'No entry has been made. Please try again or click Cancel.'
                        });
                    };

                    if (platform === 'web') {
                        scope.errorEmpty = true;
                    }
                    scope.cancelOther();
                    return false;
                };

                if (scope.obj.otherValue.length > 0) {
                    localContains = (_.some(scope.localChoices, function(i) {
                        return i.value == scope.obj.otherValue
                    }));

                    if (localContains) {
                        scope.errorDuplicate = false;
                        if (platform === 'hybrid') {
                            $ionicPopup.alert({
                                title: 'Duplicate Entries',
                                template: 'You have typed a duplicate answer. Please try again.'
                            });
                        };

                        if (platform === 'web'){
                            scope.errorDuplicate = true;
                        };

                        scope.obj.otherValue = '';
                        scope.cancelOther();
                        return false;
                    }; //end contains duplicate

                    if (scope.obj.otherValue.length > options.other_max_length) {
                       if (platform === 'hybrid'){
                            $ionicPopup.alert({
                                title: 'Too long',
                                template: 'You have typed an answer that is too long. Please try again.'
                            });
                        };

                        if (platform === 'web'){
                            scope.errorLength = true;
                        };

                        scope.cancelOther();
                        return false;
                    }; //end lengthy input

                    scope.closeModal = function() {
                        if (platform === 'web'
                            && scope.errorLength === false
                            && scope.errorDuplicate === false
                            && scope.errorEmpty === false ) {
                            scope.myOtherModal.$promise.then(scope.myOtherModal.hide);
                        };
                    };
                }
            };

            //used multiple times throughout directive - unchecks and removes 'other' value
            scope.cancelOther = function () {
                //unchecks 'other' on UI
                scope.localChoices[scope.localChoices.length - 1].checked = false;
                scope.inputValue = '';
            };

            scope.checkPreviousAnswer();

            scope.$on('reset-block', function(event){
                /*
                Listens for the reset-block event fired by the map-form whenever the user
                gets to the intro or end page of the map-form.
                This is necessary becuase the map-form do not reloead that Controller
                and qt-loader.
                */
                console.log('[single-select] reset-block');
                scope.setBlock();
                scope.value = scope.question.value;
                scope.checkPreviousAnswer();
            });
        }
    } // end return
}])
