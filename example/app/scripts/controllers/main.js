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
    $scope.formstack = {};
    $scope.current = {};
    $scope.current.form = {};
    $scope.current.block = {questions: [{
        "body": "how are you doing?",
        "label": "how are you?",
        "type": "textarea",
        "options": {"required": true}
    }]};

    $scope.current.answer = null;

  });
