'use strict';

describe('Controller: TimeCtrl', function () {
    var elm, elm2, $elm, $elm2, scope, scope2, $rootScope, $compile;

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
                "body": "When time did that happen?",
                "type": "time",
                "options": {
                    'required': true,
                    'format': 24,
                    'increments': 15
                }
            },{
                "body": "What was the time of landing?",
                "type": "time",
                "options": {
                    'format': 12,
                    'increments': 1,
                    'initial': "12:44 PM"
                }
            }]
        };


    scope = $rootScope.$new();
    scope2 = $rootScope.$new();
    $compile = _$compile_;

    $elm = angular.element(
        '<div time' +
           ' question="current.block.questions[0]"' +
           ' value="current.value"' +
           ' control="current.block.answers[0].form">' +
        '</div>');

    $elm2 = angular.element(
        '<div time' +
           ' question="current.block.questions[1]"' +
           ' value="current.value"' +
           ' control="current.block.answers[1].form">' +
        '</div>');

    //scope = $rootScope;
    elm = $compile($elm)(scope);
    elm2 = $compile($elm2)(scope2);
    scope.$digest();
    scope2.$digest();
    $rootScope.$apply();

    }));

    it('should be answered if question is required', function(){    
        var isolated = elm.isolateScope();
        isolated.value = 'Please Select a Time';

        var is_valid = isolated.internalControl.validate_answer();
        expect(is_valid).toBe(false);
    });

    it('does not have to be answered if not required', function(){    
        var isolated = elm2.isolateScope();
        isolated.value = "02:45 AM";

        var is_valid = isolated.internalControl.validate_answer();
        expect(is_valid).toBe(true);
    });

});