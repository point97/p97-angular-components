angular.module('starter.controllers', [])



/**
 * @ngdoc function
 * @name exampleApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the exampleApp
 */
angular.module('starter')
  .controller('HomeCtrl', function ($scope) {


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
            "body": "Payment delivered",
            "label": "payment delivered",
            "slug": "payment-delivered",
            "order": 1,
            "type": "toggle",
            "options": {
                "choices": {
                    "positiveLabel": "Yes",
                    "positiveValue": "1",
                    "negativeLabel": "No",
                    "negativeValue": "0"
                    }
                }
        },{
            'body': 'Enter your age. This will skip the next for if you are under 18."',
            'label': 'your age',
            'type': 'number',
            'slug': 'age',
            'options': {
                'required': false,
                'min': 1,
                'max': 150
            }
        },{
            'body': 'Please choose one of the following',
            'label': 'Select One',
            "slug": "gear-type-1",
            'type': 'single-select',
            'choices': [
                    {'verbose': 'Hook & Line', 'value': '5'},
                    {'verbose': 'Trawl Net', 'value': '6'},
                    {'verbose': 'Trap', 'value': '7'},
                ],
            'options': {
                'required': false,
                'allow_other': 1,
                "other_max_length": 10
            }
        },{
            'body': 'Please choose one of the following',
            'label': 'Select One',
            "slug": "gear-type-2",
            'type': 'single-select',
            'choices': [
                    {'verbose': 'Hook & Line', 'value': '5', 'group_value': '5'},
                    {'verbose': 'Rod n Reel', 'value': 8, 'group_value': '5'},
                    {'verbose': 'Shore Fishin', 'value': 9, 'group_value': '6'},
                    {'verbose': 'Trawl Net', 'value': '6', 'group_value': '6'},
                    {'verbose': 'Trap', 'value': '7', 'group_value': '7'},
                ],
            'options': {
                'required': true,
                'widget': 'hybrid/radio',
                "filter": "gear-type-2",
                'allow_other': 1,
                "other_max_length": 10
            }
        },{
            'body': 'This is an integer question type. Please enter an integer between -5 and 25.',
            'label': 'enter an integer',
            'type': 'integer',
            'options': {
                'required': false,
                'min': -5,
                'max': 25
            }
        },{
            'body': 'When did that happen?',
            'label': 'yyyy',
            'type': 'date',
            'options': {
                'required': false,
                'format': 'yyyy',
                'min': '2000',
                'max': '2012'
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
            "slug": "which-do-you-like-1",
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
                "allow_other": 2,
                "other_max_length": 10
            }
        },{
            "body": "Please select a choice from the following",
            "label": "Which one do you like?",
            "slug": "which-do-you-like-2",
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
                'allow_other': 2,
                "other_max_length": 25,
                'templateUrl': 'ionic/checkbox'
            }
        },{
            'body': 'Search',
            'label': 'Search...',
            'type': 'autocomplete-search',
            'options': {
                'stateRestrict': ['NY', 'MA', 'CT']
            }
        },{
            'body': '<p>This is an info page that can be a really long body<p> <p>It can also be multiple paragraphs.</p> <p><strong>And have markup</strong></p>',
            'label': 'Body...',
            'type': 'info',
            'options': {}
        },
        {
            'body': '',
            'type': 'numpad',
            'options': {}
        },
        {
            'body': 'Select a date:',
            'type': 'date',
            'options': {
                'settings':
                {
                  monthsFull: [ 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember' ],
                  monthsShort: [ 'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des' ],
                  weekdaysFull: [ 'Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu' ],
                  weekdaysShort: [ 'Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab' ],
                  today: 'hari ini',
                  clear: 'menghapus',
                  firstDay: 1,
                  format: 'yyyy/mm/dd',
                  formatSubmit: 'yyyy/mm/dd'
                },
                'min': ['2015', '03', '14'],
                'max': ['2015', '04', '20'],
                'initial':  ['2015', '03', '15']
            }
        },
        {
            'body': 'What is the time of the catch',
            'type': 'time',
            'options': {
                'format': 12,
                'increments': 15,
                'initial': "12:14 PM"
            }
        },{
            "body": "Please Map",
            "type": "map-multi-select",
            "slug": "map-fished-areas",
            "options": {
              "tileSources": [
                {
                  "url": "https://otile{s}-s.mqcdn.com/tiles/1.0.0/map/{z}/{x}/{y}.jpeg",
                  "attrib": "Tiles Courtesy of <a href='http://www.mapquest.com/' target='_blank'>MapQuest</a> <img src='http://developer.mapquest.com/content/osm/mq_logo.png'> &mdash; Map data &copy; <a href='http://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors",
                  "name": "MapQuest Open",
                  "storeName": "mapquest",
                  "maxZoom": 12,
                  "subdomain": "1234"
                },
              ],
              "labelLayer": 'http://tiles.point97.io/tiles/cal_fish_blocks/{z}/{x}/{y}.png',
              "initial": {
                "center": [
                  37.06,
                  -123.14
                ],
                "zoom": 7
              },
              "type": "list",
              "geojsonChoices": {
                "path": "mock/cal_blocks_topo.json",
                "style": {
                  "color": "#000099",
                  "opacity": 0.6,
                  "fillOpacity": 0.0,
                  "weight": 1,
                  "clickable": true
                },
                "clickStyle": {
                  "fillColor": "#dbcb7c",
                  "fillOpacity": 0.8
                }
              }
            }
          }
        ]
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
