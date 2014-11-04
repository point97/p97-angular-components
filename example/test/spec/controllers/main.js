'use strict';

describe('Controller: MainCtrl', function () {
    var elm, $elm, scope, $rootScope, MainCtrl, $compile;

    // load the controller's module
    beforeEach(module('exampleApp'));

    // load the templates
    beforeEach(module('templates'));


    // Initialize the controller and a mock scope
    beforeEach(inject(function (_$rootScope_, _$compile_) {

    // scope = $rootScope.$new();
    // dir_scope = $rootScope.$new();
    $rootScope = _$rootScope_;
    scope = $rootScope.$new();
    $compile = _$compile_;

    $elm = angular.element(
        '<div number' +
           ' question="current.block.questions[3]"' +
           ' value="current.block.answers[3].value"' +
           ' control="current.block.answers[3].form">' +
        '</div>');

    //scope = $rootScope;
    elm = $compile($elm)(scope);
    scope.$digest();
    $rootScope.$apply();

    // MainCtrl = $controller('MainCtrl', {
    //   $scope: scope
    // });

    }));

    it('should not allow a letter in the number field', function(){
    // scope.loadAnswersForBlock(scope.current.block);

    // var question_index = scope.getQuestionIndexBySlug('num');
    // console.log("Question index: "+question_index);
    // scope.current.block.answers[question_index].value = 'cat';

    console.log("Made it into first test")
    //var isolateScope = $elm.isolateScope();
    console.log(scope)
    //var is_valid = elm_scope.validate_answer();
    //expect(is_valid).toBe(false);
    });
});