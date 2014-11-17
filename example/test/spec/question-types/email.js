'use strict';

describe('Controller: EmailCtrl', function () {
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
                "body": "Please enter an email address",
                "label": "enter an email",
                "type": "email",
                "slug": "email",
                "options": {
                    "required": true
                },
            },{
              "body": "Please enter an email address",
              "label": "enter an email",
              "type": "email",
              "slug": "email",
              "options": { }
            }]
        };

    scope = $rootScope.$new();
    scope2 = $rootScope.$new();
    $compile = _$compile_;

    $elm = angular.element(
        '<div email' +
           ' question="current.block.questions[0]"' +
           ' value="current.value"' +
           ' control="current.block.answers[0].form">' +
        '</div>');

    $elm2 = angular.element(
        '<div email' +
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

    it('should not allow email addresses without a top level domain', function(){    
        var isolated = elm.isolateScope();
        isolated.value = 'bob@portland';

        var is_valid = isolated.internalControl.validate_answer();
        expect(is_valid).toBe(false);
    });

    it("should not allow email addresses without an '@' symbol", function(){    
        var isolated = elm.isolateScope();
        isolated.value = 'bob@portland';

        var is_valid = isolated.internalControl.validate_answer();
        expect(is_valid).toBe(false);
    });

    it('should not allow email addresses without a domain', function(){    
        var isolated = elm.isolateScope();
        isolated.value = 'test@';

        var is_valid = isolated.internalControl.validate_answer();
        expect(is_valid).toBe(false);
    });

    it('should not allow email addresses without a username', function(){    
        var isolated = elm.isolateScope();
        isolated.value = '@foo.bar';

        var is_valid = isolated.internalControl.validate_answer();
        expect(is_valid).toBe(false);
    });

    it('should not allow non email addresses', function(){    
        var isolated = elm.isolateScope();
        isolated.value = 'baz@io';

        var is_valid = isolated.internalControl.validate_answer();
        expect(is_valid).toBe(false);
    });

    it('should allow valid email addresses', function(){    
        var isolated = elm.isolateScope();
        isolated.value = 'cat@doge.com';

        var is_valid = isolated.internalControl.validate_answer();
        expect(is_valid).toBe(true);
    });

    it('should allow valid email addresses', function(){    
        var isolated = elm.isolateScope();
        isolated.value = 'point97@pdx.eu';

        var is_valid = isolated.internalControl.validate_answer();
        expect(is_valid).toBe(true);
    });

    it('should be valid when input is entered but not required', function() {
        var isolated = elm2.isolateScope();
        isolated.value = 'coastal@recreation.io';

        var is_valid = isolated.internalControl.validate_answer();
        expect(is_valid).toBe(true);

    });

    //
});