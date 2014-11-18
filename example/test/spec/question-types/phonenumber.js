'use strict';

describe('Controller: PhoneCtrl', function () {
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
                "body": "What is your phone number?",
                "label": "+1 (888) 123-4567",
                "type": "phonenumber",
                "options": { 
                    "required": true,
                    "format": 'North America',
                    "country": '1' 
                }
            },{
                "body": "What is your phone number?",
                "label": "+261 22 33 444 55",
                "type": "phonenumber",
                "options": { 
                    "required": false,
                    "format": 'International',
                    "country": '261'
                }
            }]
        };

    scope = $rootScope.$new();
    scope2 = $rootScope.$new();
    $compile = _$compile_;

    $elm = angular.element(
        '<div phonenumber' +
           ' question="current.block.questions[0]"' +
           ' value="current.value"' +
           ' control="current.block.answers[0].form">' +
        '</div>');

    $elm2 = angular.element(
        '<div phonenumber' +
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
        isolated.value = null;

        var is_valid = isolated.internalControl.validate_answer();
        expect(is_valid).toBe(false);
    });

    //NORTH AMERICA
    it('should be a valid North American phonenumber', function(){    
        var isolated = elm.isolateScope();
        isolated.value = '8885551234';

        var is_valid = isolated.internalControl.validate_answer();
        expect(is_valid).toBe(true);
    });

    it('should allow parens around area codes for North American phonenumbers', function(){    
        var isolated = elm.isolateScope();
        isolated.value = '(123)5559876';

        var is_valid = isolated.internalControl.validate_answer();
        expect(is_valid).toBe(true);
    });  

    it('should allow dashes between numbers 3&4 and 6&7 for North American phonenumbers', function(){    
        var isolated = elm.isolateScope();
        isolated.value = '(123)-555-9876';

        var is_valid = isolated.internalControl.validate_answer();
        expect(is_valid).toBe(true);
    }); 

    it('should allow periods between numbers 3&4 and 6&7 for North American phonenumbers', function(){    
        var isolated = elm.isolateScope();
        isolated.value = '(123).555.9876';

        var is_valid = isolated.internalControl.validate_answer();
        expect(is_valid).toBe(true);
    }); 

    //International
    it('should be a valid input for an international phonenumber', function(){    
        var isolated = elm2.isolateScope();
        isolated.value = '223 217 51';

        var is_valid = isolated.internalControl.validate_answer();
        expect(is_valid).toBe(true);
    }); 

    it('should not accept anything other than numbers for an international phonenumber', function(){    
        var isolated = elm2.isolateScope();
        isolated.value = 'cat12# 217 51';

        var is_valid = isolated.internalControl.validate_answer();
        expect(is_valid).toBe(false);
    }); 

    it('should allow the ability to have no spaces after country code', function(){    
        var isolated = elm2.isolateScope();
        isolated.value = '140205050';

        var is_valid = isolated.internalControl.validate_answer();
        expect(is_valid).toBe(true);
    }); 

    //Parsing
    it('should parse North American phonenumbers properly', function(){    
        var isolated = elm.isolateScope();
        isolated.value = '(888) 123-4567';

        var output = isolated.internalControl.parse_phone();
        expect(output).toEqual(['+1', '888', '1234567']);
    }); 

    it('should parse International phonenumbers properly', function(){    
        var isolated = elm2.isolateScope();
        isolated.value = '334534344';

        var output = isolated.internalControl.parse_phone();
        expect(output).toEqual(['+261', '334534344']);
    }); 

});