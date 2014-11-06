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
                    "min_word": 3,
                    "max_word": 10,
                    "show_word_count":true,
                    "show_char_count":true
                }
            },{
                "body": "When did that happen?",
                "label": "mm/dd/yyyy",
                "type": "datetime",
                "options": {
                    "required": true,
                    "datejs_format": "MM/dd/yyyy"
                }
            },{
                "body": "This is a yes-no question. Do you like cheese?",
                "label": "do you like cheese",
                "type": "yes-no",
                "options": {"required": true}
            },{
                "body": "This is a number question. I can be a decimal. Enter a number between 1 and 10",
                "label": "enter a number",
                "type": "number",
                "slug": "num",
                "options": {
                    "required": true,
                    "min": 1,
                    "max": 10
                }
            }]
        };

    scope = $rootScope.$new();
    $compile = _$compile_;

    $elm = angular.element(
        '<div number' +
           ' question="current.block.questions[3]"' +
           ' value="current.value"' +
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
        var isolated = elm.isolateScope();
        isolated.value = 'cat';

        var is_valid = isolated.internalControl.validate_answer();
        expect(is_valid).toBe(false);
    });

    it('should not exceed max', function() {
        var isolated = elm.isolateScope();
        isolated.value = 15;

        var is_valid = isolated.internalControl.validate_answer();
        expect(is_valid).toBe(false);
    });

    it('should be greater than min', function() {
        var isolated = elm.isolateScope();
        isolated.value = -2;

        var is_valid = isolated.internalControl.validate_answer();
        expect(is_valid).toBe(false);
    });

    it('should be within range', function() {
        var isolated = elm.isolateScope();
        isolated.value = 4;

        var is_valid = isolated.internalControl.validate_answer();
        expect(is_valid).toBe(true);

    });
});