'use strict';

describe('Controller: IntCtrl', function () {
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
                "body": "This is a question that deals with integers. Enter a integer between -10 and 10",
                "label": "enter a integer",
                "type": "integer",
                "slug": "int",
                "options": {
                    "required": true,
                    "min": -10,
                    "max": 10
                },
            },{
              "body": "This is a question that deals with integers. Please enter an one.",
              "label": "enter a integer",
              "type": "integer",
              "slug": "int",
              "options": { }
            }]
        };

    scope = $rootScope.$new();
    scope2 = $rootScope.$new();
    $compile = _$compile_;

    $elm = angular.element(
        '<div integer' +
           ' question="current.block.questions[0]"' +
           ' value="current.value"' +
           ' control="current.block.answers[0].form">' +
        '</div>');

    $elm2 = angular.element(
        '<div integer' +
           ' question="current.block.questions[1]"' +
           ' value="current.value"' +
           ' control="current.block.answers[1].form">' +
        '</div>');

    //scope = $rootScope;
    elm = $compile($elm)(scope);
    elm2 = $compile($elm2)(scope2);
    scope.$digest();
    $rootScope.$apply();

    }));

    it('should not allow numbers that are not integers', function(){    
        var isolated = elm.isolateScope();
        isolated.value = 2.34;
        
        var is_valid = isolated.internalControl.validate_answer();
        expect(is_valid).toBe(false);
    });

    it('should not allow non numerics', function(){    
        var isolated = elm.isolateScope();
        isolated.value = 'cat';

        var is_valid = isolated.internalControl.validate_answer();
        expect(is_valid).toBe(false);
    });

    it('should not exceed max', function() {
        var isolated = elm.isolateScope();
        isolated.value = 11;

        var is_valid = isolated.internalControl.validate_answer();
        expect(is_valid).toBe(false);
    });

    it('should be greater than min', function() {
        var isolated = elm.isolateScope();
        isolated.value = -12;

        var is_valid = isolated.internalControl.validate_answer();
        expect(is_valid).toBe(false);
    });

    it('should be within range', function() {
        var isolated = elm.isolateScope();
        isolated.value = -4;

        var is_valid = isolated.internalControl.validate_answer();
        expect(is_valid).toBe(true);

    });

    it('should be within a value when required', function() {
        var isolated = elm.isolateScope();
        isolated.value = null;

        var is_valid = isolated.internalControl.validate_answer();
        expect(is_valid).toBe(false);

    });

    it('should be within a value when not required', function() {
        var isolated = elm2.isolateScope();
        isolated.value = 3;

        var is_valid = isolated.internalControl.validate_answer();
        expect(is_valid).toBe(true);

    });

    //
});