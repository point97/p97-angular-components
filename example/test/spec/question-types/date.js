'use strict';

describe('Controller: DateCtrl', function () {
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
                "body": "When did that happen?",
                "label": "mm/dd/yyyy",
                "type": "date",
                "options": {
                    "required": true,
                    "format": "yyyy",
                    "min": 2000,
                    "max": 2002
                }
            },{
                "body": "What date was that?",
                "label": "Dates",
                "type": "date",
                "options": {
                    "min": '2014-04-20',
                    "max": '2014-07-15' 
                }
            }]
        };

    scope = $rootScope.$new();
    scope2 = $rootScope.$new();
    $compile = _$compile_;

    $elm = angular.element(
        '<div date' +
           ' question="current.block.questions[0]"' +
           ' value="current.value"' +
           ' control="current.block.answers[0].form">' +
        '</div>');

    $elm2 = angular.element(
        '<div date' +
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
        isolated.value = '';

        var is_valid = isolated.internalControl.validate_answer();
        expect(is_valid).toBe(false);
    });

    it('does not have to be answered if not required', function(){    
        var isolated = elm2.isolateScope();
        isolated.value = "";

        var is_valid = isolated.internalControl.validate_answer();
        expect(is_valid).toBe(true);
    });

    it('should be a realistic year if the format is defined as yyyy', function(){    
        var isolated = elm.isolateScope();
        isolated.value = '1731';

        var is_valid = isolated.internalControl.validate_answer();
        expect(is_valid).toBe(false);
    });

    it('should not be lower than the defined min', function(){    
        var isolated = elm.isolateScope();
        isolated.value = '1999';

        var is_valid = isolated.internalControl.validate_answer();
        expect(is_valid).toBe(false);
    });

    it('should not be higher than the defined max', function(){    
        var isolated = elm.isolateScope();
        isolated.value = '2001';

        var is_valid = isolated.internalControl.validate_answer();
        expect(is_valid).toBe(true);
    });

    it('should be within range', function(){    
        var isolated = elm.isolateScope();
        isolated.value = '2001';

        var is_valid = isolated.internalControl.validate_answer();
        expect(is_valid).toBe(true);
    });

    it('should not be lower than defined min on a datepicker', function(){
        /* on browser this test isn't neccessary, while
        on mobile, ionic allows users to override min/max */      
        var isolated = elm2.isolateScope();
        isolated.value = '2002-03-12';

        var is_valid = isolated.internalControl.validate_answer();
        expect(is_valid).toBe(false);
    });

    it('should not be lower than defined max on a datepicker', function(){
        /* on browser this test isn't neccessary, while
        on mobile, ionic allows users to override min/max */      
        var isolated = elm2.isolateScope();
        isolated.value = '2022-09-08';

        var is_valid = isolated.internalControl.validate_answer();
        expect(is_valid).toBe(false);
    });

    it('should be in range on a datepicker', function(){
        /* on browser this test isn't neccessary, while
        on mobile, ionic allows users to override min/max */   
        var isolated = elm2.isolateScope();
        isolated.value = '2014-05-08';

        var is_valid = isolated.internalControl.validate_answer();
        expect(is_valid).toBe(true);
    });

});