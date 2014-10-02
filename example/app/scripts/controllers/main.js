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
    

    $scope.numberControl = {};


    $scope.current = {};
    $scope.current.form = {};
    $scope.current.block = {
        questions: [{
            "body": "how are you doing?",
            "label": "how are you?",
            "slug": "how-are-you",
            "type": "textarea",
            "options": {
                "required": true,
                "min_word": 3,
                "max_word": 10,
                "show_word_count":true,
                "show_char_count":true
            }
        },{
            "body": "When did that happen?",
            "label": "mm/dd/yyyy",
            "type": "datetime",
            "options": {
                "required": true,
                "datejs_format": "MM/dd/yyyy"
            }
        },{
            "body": "This is a yes-no question. Do you like cheese?",
            "label": "do you like cheese",
            "type": "yes-no",
            "options": {"required": true}
        },{
            "body": "This is a number question. I can be a decimal. Enter a number between 1 and 10",
            "label": "enter a number",
            "type": "number",
            "slug": "num",
            "options": {
                "required": true,
                "min": 1,
                "max": 10
            }
        }]
    };

    //Create empty answers array (one for each question)
    $scope.loadAnswersForBlock = function(block) {
        // This function belings on the block controller.
        $scope.current.block.answers = _.map(block.questions, function(q){
            return {'verbose':'', value:null, form:{}};
        });

    };
    $scope.loadAnswersForBlock($scope.current.block);

    // Save button callback
    $scope.saveBlockCallback = function(){
        
        // clean_data
        var isBlockValid = true;
        _.each($scope.current.block.answers, function(answer){
            try {
                answer.form.clean_answer();
                var isValid = answer.form.validate_answer();
                if (!isValid){
                    isBlockValid = false;
                }
            } catch(err) {
                console.log(err)
                console.log(answer)
            }
            
        });

        if (isBlockValid){
            $scope.current.block.message = 'Block Saved.';
        } else {
            $scope.current.block.message = 'There are some errors.';
        }
    };

    

  });
