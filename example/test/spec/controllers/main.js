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
    
    console.log($elm.isolateScope())
    var isolateScope = $elm.isolateScope();
    console.log(isolateScope.internalControl.validate_answer)
    //var is_valid = elm_scope.validate_answer();
    //expect(is_valid).toBe(false);
  });

  // it('should have a block with questions to test with', function () {
  //   expect(scope.current.block.questions.length).toBe(4);

  // });

  // it('should load an answer array for each question', function(){
  //   scope.loadAnswersForBlock(scope.current.block);
  //   expect(scope.current.block.answers.length).toBe(scope.current.block.questions.length);

  // })

  // it('should have add cat to the number value', function () {
  //   var input = elm.find('input');
  //   expect(input.val()).toBe('');
  //   expect(elm.scope()).toBeDefined();

  //   var question_index = scope.getQuestionIndexBySlug('num');
  //   scope.current.block.answers[question_index].value = 5;
  //   console.log(input)
  //   //expect(input.val()).toBe(5);
  // });

});
