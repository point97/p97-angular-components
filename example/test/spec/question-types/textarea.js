'use strict';

describe('Controller: TextareaCtrl', function () {
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
                "body": "how are you doing?",
                "label": "how are you?",
                "slug": "how-are-you",
                "type": "textarea",
                "options": {
                    "required": true,
                    "min_word": 2,
                    "max_word": 10,
                    "min_char": 6,
                    "max_char": 45,
                    "show_word_count":true,
                    "show_char_count":true
                }
            },{
                "body": "How goes it?",
                "label": "How goes it?",
                "slug": "how-goes-it",
                "type": "textarea",
                "options": {
                    "required": false,
                    "min_char": 5,
                    "max_char": 15,
                    "show_char_count": true
                }   
            }]
        };

    scope = $rootScope.$new();
    scope2 = $rootScope.$new();
    $compile = _$compile_;

    $elm = angular.element(
        '<div textarea' +
           ' question="current.block.questions[0]"' +
           ' value="current.value"' +
           ' control="current.block.answers[0].form">' +
        '</div>');

    $elm2 = angular.element(
        '<div textarea' +
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

    it('should have at least the minimum word count', function() {
        var isolated = elm.isolateScope();
        $rootScope.$apply(function() {
            isolated.value = "hi!";
        });
        var is_valid = isolated.internalControl.validate_answer();
        expect(is_valid).toBe(false);
    });

    it('should not exceed the maximum word count', function() {
        var isolated = elm.isolateScope();
         $rootScope.$apply(function() {
            isolated.value = "one two three four five 6 7 8 9 10 11";
        });
        var is_valid = isolated.internalControl.validate_answer();
        expect(is_valid).toBe(false);
    });

    it('should be within range', function() {
        var isolated = elm.isolateScope();
        $rootScope.$apply(function() {
            isolated.value = "Point97 is using unit-test";
        });
        var is_valid = isolated.internalControl.validate_answer();
        expect(is_valid).toBe(true);

    });

    it('should have at least a minimum char count', function() {
        var isolated = elm2.isolateScope();
        $rootScope.$apply(function() {
            isolated.value = "test";
        });
        var is_valid = isolated.internalControl.validate_answer();
        expect(is_valid).toBe(false);

    });

    it('should have at least a minimum char count', function() {
        var isolated = elm2.isolateScope();
        $rootScope.$apply(function() {
            isolated.value = "test";
        });
        var is_valid = isolated.internalControl.validate_answer();
        expect(is_valid).toBe(false);

    });

    it('should not exceed maximum char count', function() {
        var isolated = elm2.isolateScope();
        $rootScope.$apply(function() {
            isolated.value = "Unit-testing for P97 angular components";
        });
        var is_valid = isolated.internalControl.validate_answer();
        expect(is_valid).toBe(false);

    });

    it('should use word_count options before char_count', function() {
        var isolated = elm.isolateScope();
        $rootScope.$apply(function() {
            isolated.value = "hey !";
        });
        var is_valid = isolated.internalControl.validate_answer();
        expect(is_valid).toBe(true);

    });

});