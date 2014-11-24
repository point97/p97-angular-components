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
            'body': 'how are you doing?',
            'label': 'how are you?',
            'slug': 'how-are-you',
            'type': 'textarea',
            'options': {
                'required': true,
                'min_word': 3,
                'max_word': 10,
                'show_word_count':true,
                'show_char_count':true
            }
        },{
            'body': 'When did that happen?',
            'label': 'MM/dd/yyyy HH:mm:ss',
            'type': 'datetime',
            'options': {
                'required': true,
                'datejs_format': 'MM/dd/yyyy HH:mm:ss'
            }
        },{
            'body': 'This is a yes-no question. Do you like cheese?',
            'label': 'do you like cheese',
            'type': 'yes-no',
            'options': {'required': true}
        },{
            'body': 'This is a number question. I can be a decimal. Enter a number between 1 and 10',
            'label': 'enter a number',
            'type': 'number',
            'slug': 'num',
            'options': {
                'required': true,
                'min': 1,
                'max': 10
            }
        },{
            'body': 'Please choose one of the following',
            'label': 'Select One',
            'type': 'single-select',
            'choices': [
                    {'verbose': 'Hook & Line', 'value': '5'},
                    {'verbose': 'Trawl Net', 'value': '6'},
                    {'verbose': 'Trap', 'value': '7'},
                ],
            'options': {
                'required': false,
                'allow_other': 1
            }
        },{
            'body': 'Please choose one of the following',
            'label': 'Select One',
            'type': 'single-select',
            'choices': [
                    {'verbose': 'Hook & Line', 'value': '5'},
                    {'verbose': 'Trawl Net', 'value': '6'},
                    {'verbose': 'Trap', 'value': '7'},
                ],
            'options': {
                'required': true,
                'templateUrl': 'ionic/radio',
                'allow_other': 1
            }
        },{
            'body': 'This is an integer question type. Please enter an integer between -5 and 25.',
            'label': 'enter an integer',
            'type': 'integer',
            'options': {
                'required': true,
                'min': -5,
                'max': 25
            }
        },{
            'body': 'When did that happen?',
            'label': 'MM/dd/yyyy',
            'type': 'date',
            'options': {
                'required': true,
                'datejs_format': 'MM/dd/yyyy'
            }
        },{
            'body': 'How are you feeling?',
            'label': 'how are you feeling?',
            'slug': 'how-are-you',
            'type': 'text',
            'options': {
                "required": true,
                "min_word": 2,
                "max_word": 10,
                "min_char": 6,
                "max_char": 45,
                "show_word_count":true,
                "show_char_count":true
            }
        },{
            "body": "Please enter an email address",
            "label": "enter an email",
            "type": "email",
            "slug": "email",
            "options": {
                "required": true
            }
        },{
            "body": "What is your phone number?",
            "label": "+1 (888) 123-4567",
            "type": "phonenumber",
            "options": { 
                "required": true,
                "format": 'North America',
                "country": '1' 
            }
        },{
            "body": "Please select a choice from the following",
            "label": "Which one do you like?",
            "choices": [
                {'verbose': 'Hook & Line', 'value': '5'},
                {'verbose': 'Trawl Net', 'value': '6'},
                {'verbose': 'Trap', 'value': '7'},
                {'verbose': 'Siene Net', 'value': '8'},
                {'verbose': 'Drift Net', 'value': '9'}
            ],
            "options": {
                "required": true,
                "min_choice": 1,
                "max_choice": 4,
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
                var cleaned_value = answer.form.clean_answer();
                var isValid = answer.form.validate_answer();
                if (!isValid){
                    isBlockValid = false;
                }
                else {
                    answer.value = cleaned_value; 
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
