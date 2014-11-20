'use strict';

describe('Controller: MultiCtrl', function () {
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
                    "min_choice": 2,
                    "max_choice": 4,
                }
            }]
        };

    scope = $rootScope.$new();
    $compile = _$compile_;

    $elm = angular.element(
        '<div multi-select' +
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

    it('should be answered if question is required', function(){    
        var isolated = elm.isolateScope();
        isolated.value = null;

        var is_valid = isolated.internalControl.validate_answer();
        expect(is_valid).toBe(false);
    });

    it('should not exceed max number of choices if set as an option', function(){    
        var isolated = elm.isolateScope();
        isolated.value = ["Hook & Line", "Trawl Net", "Trap", "Siene Net", "Drift Net"];
        isolated.choices_selected = isolated.value.length;

        var is_valid = isolated.internalControl.validate_answer();
        expect(is_valid).toBe(false);
    });

    it('should have at least the min number of choices if set as an option', function(){    
        var isolated = elm.isolateScope();
        isolated.value = ["Hook & Line"];
        isolated.choices_selected = isolated.value.length;

        var is_valid = isolated.internalControl.validate_answer();
        expect(is_valid).toBe(false);
    });

    it('should be within a min and max range if defined', function(){    
        var isolated = elm.isolateScope();
        isolated.value = ["Hook & Line", "Trawl Net", "Trap"];
        isolated.choices_selected = isolated.value.length;

        var is_valid = isolated.internalControl.validate_answer();
        expect(is_valid).toBe(true);
    });

});