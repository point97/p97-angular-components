'use strict';

describe('Controller: DatetimeCtrl', function () {
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
                "label": "mm/dd/yyyy hh:mm:ss",
                "type": "datetime",
                "options": {
                    "required": true,
                    "datejs_format": "MM/dd/yyyy HH:mm:ss"
                }
            },{
                "body": "What date was that?",
                "label": "dd/mm/yyyy ss:mm:hh",
                "type": "datetime",
                "options": {
                    "datejs_format": "dd/MM/yyyy ss:mm:HH"
                }
            }]
        };

    scope = $rootScope.$new();
    scope2 = $rootScope.$new();
    $compile = _$compile_;

    $elm = angular.element(
        '<div datetime' +
           ' question="current.block.questions[0]"' +
           ' value="current.value"' +
           ' control="current.block.answers[0].form">' +
        '</div>');

    $elm2 = angular.element(
        '<div datetime' +
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
        isolated.value = '';

        var is_valid = isolated.internalControl.validate_answer();
        expect(is_valid).toBe(true);
    });

    it('should be in the proper format', function(){    
        var isolated = elm.isolateScope();
        isolated.value = '05/25/1986 16:30:55';

        var is_valid = isolated.internalControl.validate_answer();
        expect(is_valid).toBe(true);
    });

    it('should follow the proper format when not default', function(){    
        var isolated = elm2.isolateScope();
        isolated.value = '31/03/2014 34:15:21';

        var is_valid = isolated.internalControl.validate_answer();
        expect(is_valid).toBe(true);
    });

    it('should follow the rules of actual dates', function(){    
        var isolated = elm.isolateScope();
        isolated.value = '15/12/2010 10:14:45';

        var is_valid = isolated.internalControl.validate_answer();
        expect(is_valid).toBe(false);
    });

    it('should follow the rules of actual time', function(){    
        var isolated = elm.isolateScope();
        isolated.value = '12/10/2010 25:14:45';

        var is_valid = isolated.internalControl.validate_answer();
        expect(is_valid).toBe(false);
    });

});