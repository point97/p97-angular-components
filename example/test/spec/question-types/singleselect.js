'use strict';

describe('Controller: SingleCtrl', function () {
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
                "body": "Please select a choice from the following",
                "label": "Which one do you like?",
                "choices": [
                    {'verbose': 'Hook & Line', 'value': '5'},
                    {'verbose': 'Trawl Net', 'value': '6'},
                    {'verbose': 'Trap', 'value': '7'},
                ],
                "options": {
                    "required": true,
                    "allow_other": 1
                }
            },{
                "body": "Please select a choice from the following",
                "label": "Which one do you like?",
                "choices": [
                    {'verbose': 'Hook & Line', 'value': '5'},
                    {'verbose': 'Trawl Net', 'value': '6'},
                    {'verbose': 'Trap', 'value': '7'},
                ],
                "options": {
                    "required": false,
                    "allow_other": 1
                }
            }]
        };

    scope = $rootScope.$new();
    scope2 = $rootScope.$new();
    $compile = _$compile_;

    $elm = angular.element(
        '<div single-select' +
           ' question="current.block.questions[0]"' +
           ' value="current.value"' +
           ' control="current.block.answers[0].form">' +
        '</div>');
    $elm2 = angular.element(
        '<div single-select' +
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

    it('should be answered if the question is required', function(){    
        var isolated = elm.isolateScope();
        isolated.value = null;

        var is_valid = isolated.internalControl.validate_answer();
        expect(is_valid).toBe(false);
    });

    it('should be optional if the question is not required', function(){    
        var isolated = elm2.isolateScope();
        isolated.value = null;

        var is_valid = isolated.internalControl.validate_answer();
        expect(is_valid).toBe(true);
    });

    it('should have the user input equal a cleaned value', function(){    
        var isolated = elm.isolateScope();
        isolated.value = 'test123';

        var clean = isolated.internalControl.clean_answer();
        expect(clean).toEqual(isolated.value);
    });

    it('should have an input if the otherOption is selected', function(){    
        var isolated = elm.isolateScope();
        isolated.value = 'other';
        isolated.otherValue = null;

        var is_valid = isolated.internalControl.validate_answer();
        expect(is_valid).toEqual(false);
    });

    it('should not allow symbols or other random characters for otherValue', function(){    
        var isolated = elm.isolateScope();
        isolated.value = 'other';
        isolated.otherValue = '&@&#!!fdgkljdf'

        var is_valid = isolated.internalControl.validate_answer();
        expect(is_valid).toBe(false);
    });


    it('should only allow valid inputs for otherValue', function(){    
        var isolated = elm.isolateScope();
        isolated.value = 'other';
        isolated.otherValue = 'This, is a valid input123.'

        var is_valid = isolated.internalControl.validate_answer();
        expect(is_valid).toBe(true);
    });


    it('should equal the otherValue if user inputs text upon Other selection', function(){    
        var isolated = elm.isolateScope();
        isolated.value = 'other';
        isolated.otherValue = 'test'

        var clean = isolated.internalControl.clean_answer();
        expect(clean).toEqual("test");
    });

});