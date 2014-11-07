'use strict';

describe('Controller: YnCtrl', function () {
    var elm, $elm, scope, $rootScope, $compile;

    // load the controller's module
    beforeEach(module('exampleApp'));

    // load the templates
    beforeEach(module('templates'));


    // Initialize the controller and a mock scope
    beforeEach(inject(function (_$rootScope_, _$compile_) {

    // scope = $rootScope.$new();
    // dir_scope = $rootScope.$new();
    $rootScope = _$rootScope_;

    $rootScope.current = {};
        $rootScope.current.form = {};
        $rootScope.current.block = {
            questions: [{
                "body": "This is a yes-no question. Do you like cheese?",
                "label": "Do you like cheese",
                "type": "yes-no",
                "options": {"required": true}
            }]
        };

    scope = $rootScope.$new();
    $compile = _$compile_;

    $elm = angular.element(
        '<div number' +
           ' question="current.block.questions[0]"' +
           ' value="current.value"' +
           ' control="current.block.answers[0].form">' +
        '</div>');

    //scope = $rootScope;
    elm = $compile($elm)(scope);
    scope.$digest();
    $rootScope.$apply();

    }));

    it('should be answered if question is required', function(){    
        var isolated = elm.isolateScope();
        isolated.value = null;

        var is_valid = isolated.internalControl.validate_answer();
        expect(is_valid).toBe(false);
    });

});