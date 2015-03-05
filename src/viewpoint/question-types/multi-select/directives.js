angular.module('p97.questionTypes')
  .directive('multiSelect', ['$http', '$templateCache', '$compile', '$injector', '$sce',  function($http, $templateCache, $compile, $injector, $sce){
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
            control: '='
        },
        link: function(scope, element, attrs) {

            if (!scope.question) return;

            var options = scope.question.options;
            var reg = /^[A-Za-z\d() _.,-]*$/;
            scope.errorDuplicate = false;
            scope.errorLength = false;
            
            scope.setBlock = function(){
                scope.showOtherInput = false;
                scope.choicesSelected = 0;
                scope.errors = [];
                scope.valueArray = [];
                scope.obj = {'otherValue': null}
                scope.localChoices = angular.copy(scope.question.choices); // This creates a deep copy

                // auto selects if only one choice exists
                if (scope.question.choices.length === 1) scope.value = scope.question.choices[0].value;

                if (options.allow_other > 0) {
                    var otherChoice = { 'verbose': 'Other', 'value': 'other' }
                    scope.localChoices.push(otherChoice);
                }
            }
            scope.setBlock();

            

            scope.getContentUrl = function() {
                if(scope.question.options.widget)
                    return BASE_TEMPLATE_URL+'multi-select/templates/'+scope.question.options.widget+'.html';
                else
                    return BASE_TEMPLATE_URL+'multi-select/templates/'+platform+'/checkbox.html';
            }

            scope.renderHtml = function(htmlCode) {
                return $sce.trustAsHtml(htmlCode);
            };

            

            // //auto selects if only one choice exists
            // if (scope.question.choices.length === 1) scope.value = scope.question.choices[0].value;

            // if (options.allow_other > 0) {
            //     var otherChoice = { 'verbose': 'Other', 'value': 'other' }
            //     scope.localChoices.push(otherChoice);
            // }

            // This is availible in the main controller.
            scope.resetBlock = function(){
                scope.setBlock();
                scope.value = scope.question.value; 
                scope.togglePrevAnswers();
            } 

            scope.internalControl = scope.control || {};
            scope.internalControl.validate_answer = function(){
                scope.errors = [];

                if (options.required && options.required === true) {
                    if (scope.value.length === 0) {
                        scope.errors.push('This field is required')
                    }
                }

                if (options.max_choice && typeof(options.max_choice === 'number')) {
                    if (scope.choicesSelected > options.max_choice) {
                        scope.errors.push('You can have up to '+options.max_choice+' choices. You currently have ' + scope.choicesSelected)
                    }
                }

                if (options.min_choice && typeof(options.min_choice === 'number')) {
                    if (scope.choicesSelected < options.min_choice) {
                        scope.errors.push('You need at least '+options.min_choice+' choices. You currently have ' + scope.choicesSelected)
                    }
                }

                if (scope.value.length > 0) {
                    _.each(scope.value, function(i) { 
                        if (!reg.test(i)) {
                            scope.errors.push("Your 'Other' input is invalid. Please try again without using special characters or symbols")
                        } else if ((i === 'other') && !scope.otherValue || scope.otherValue === null) {
                            scope.errors.push("You selected 'Other'. Please fill in a response or type in another choice")
                        }
                    })
                }

                return (scope.errors.length === 0);
            };

            scope.internalControl.clean_answer = function(){
                //nothing to see here
            };

            //adds respondant's choices to a valueArray
            scope.addChoicesToArray = function(choiceValue) {

                //check there are previousAnswers and are not empty responses
                if (scope.value && scope.value !== "") {
                    scope.valueArray = scope.value;
                }

                var index = scope.valueArray.indexOf(choiceValue);
                if (index > -1) {
                    //remove items from valueArray
                    scope.valueArray.splice(index, 1);
                } else {
                    //add items to valueArray
                    scope.valueArray.push(choiceValue);
                }
                (scope.valueArray.length > 0) ? scope.value = scope.valueArray : scope.value;
            };
            

            //show Other Input in Modal on click
            scope.otherInputModal = function() {
                //hybrid-ionic
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
                };

                //web - angular-strap
                if (platform === 'web') {
                    scope.errorDuplicate = false;
                    scope.errorLength = false;
                     var myOtherModal = $modal({
                        scope: scope, 
                        template: 'templates/web/partials/other-input-modal.html', 
                        show: true
                    });
                };
            }

            //confirmation function for otherInputModal
            scope.confirmModalOtherValue = function() {
                if (scope.otherValueCheck() == false) {
                  return false;
                };
                var newChoice = { 'verbose': 'User Entered: '+scope.obj.otherValue, 'value': scope.obj.otherValue, 'checked': true};
                //inserts newChoice into question.choices in front of 'Other'
                scope.localChoices.splice(scope.localChoices.length -1, 0, newChoice);
                //removes 'other' item from valueArray and replaces it with user defined otherValue
                scope.value[scope.value.indexOf('other')] = scope.obj.otherValue;
                //toggle off 'other' item
                scope.localChoices[scope.localChoices.length - 1].checked = false;
                scope.obj.otherValue = '';
            };

            //notification confirmation for 'other' answer
            scope.otherValueCheck = function() {

                if (scope.obj.otherValue.length > 0) {
                    if (_.contains(scope.value, scope.obj.otherValue)) {
                        scope.errorDuplicate = false;
                        if (platform === 'hybrid'){
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
                        scope.errorLength = false;
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
                }
            };

            scope.$watch('valueArray', function(newValues) {
                if (!newValues) return;

                //watch  the number of choices selected within valueArray
                var choicesSelected = newValues.length;
                scope.choicesSelected = choicesSelected;

                //show or hides text input depending on if valueArray contains an 'other' value
                if (_.contains(newValues, 'other')) {
                    scope.otherInputModal();
                } 
            }, true);

            

            //toggles and checks UI on localChoices for previousAnswers - will only run at start
            scope.togglePrevAnswers = function () {
 
                //set all choices as unchecked
                _.each(scope.localChoices, function(i) {
                    i.checked = false;
                });

                //loops through all previousAnswers
                _.each(scope.value, function(i) {
                    choiceValues = _.pluck(scope.localChoices, "value");
                    if (!_.contains(choiceValues, i)) {
                        //append previously saved 'Other' answer to question.choices
                        var addOther = { 'verbose': 'User Entered: '+i, 'value': i, 'checked': true }
                        scope.localChoices.splice(scope.localChoices.length -1, 0, addOther);
                    } else {
                        //find index location and toggle choice as checked
                        var choice = _.find(scope.localChoices, function(item) {
                            return item.value === i;
                        });
                        choice.checked = true;
                    }
                });
            };

            //used multiple times throughout directive - unchecks and removes 'other' value from array
            scope.cancelOther = function () {
                //unchecks 'other' on UI
                scope.localChoices[scope.localChoices.length - 1].checked = false;
                //removes 'other' from both value and valueArray
                scope.value = _.compact(_.without(scope.value, 'other'));
                scope.valueArray = _.compact(_.without(scope.valueArray, 'other'));
            };

            scope.togglePrevAnswers();

            scope.$on('reset-block', function(event){
                /*
                Listens for the reset-block event fired by the map-form whenever the user 
                gets to the intro or end page of the map-form. 
                This is necessary becuase the map-form do not reloead that Controller
                and qt-loader.
                */
                console.log('[multi-select] reset-block');
                scope.resetBlock();
            });

            // Compile the template into the directive's scope.
            $http.get(scope.getContentUrl(), { cache: $templateCache }).success(function(response) {
                var contents = element.html(response).contents();
                $compile(contents)(scope);
            });
        }
    } // end return 
}])