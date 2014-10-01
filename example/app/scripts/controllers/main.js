'use strict';

/**
 * @ngdoc function
 * @name exampleApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the exampleApp
 */
angular.module('exampleApp')
  .controller('MainCtrl', function ($scope) {
    
    $scope.current = {};
    $scope.current.form = {};
    $scope.current.block = {
        questions: [{
            "body": "how are you doing?",
            "label": "how are you?",
            "type": "textarea",
            "options": {"required": true}
        },{
            "body": "When did that happen?",
            "label": "select a date and time",
            "type": "datetime",
            "options": {"required": true}
        },{
            "body": "This is a yes-no question. Do you like cheese?",
            "label": "do you like cheese",
            "type": "yes-no",
            "options": {"required": true}
        },{
            "body": "This is a number question. I can be a decimal. Enter a number between 1 and 10",
            "label": "enter a number",
            "type": "number",
            "options": {"required": true}
        },{
            "body": "This textarea 2",
            "label": "enter a something",
            "type": "textarea",
            "options": {"required": true}
        }]
    };

    //Create empty answers array (one for each question)
    $scope.loadAnswersForBlock = function(block) {
        // This function belings on the block controller.
        $scope.current.block.answers = _.map(block.questions, function(q){
            return {'verbose':'', value:null};
        });
    };

    $scope.loadAnswersForBlock($scope.current.block);

  });
