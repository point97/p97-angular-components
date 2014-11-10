'use strict';

describe('Controller: TextareaCtrl', function () {
    var elm, elm2, elm3, $elm, $elm2, $elm3, scope, scope2, scope3, $rootScope, $compile;

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
            },{
                "body": "How long can this go?",
                "label": "How long can this go?",
                "slug": "how-long",
                "type": "textarea",
                "options": {
                    "required": false,
                    "min_word": 5,
                    "max_word": 650,
                    "show_char_count": true
                }   
            }]
        };

    scope = $rootScope.$new();
    scope2 = $rootScope.$new();
    scope3 = $rootScope.$new();
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

    $elm3 = angular.element(
        '<div textarea' +
           ' question="current.block.questions[2]"' +
           ' value="current.value"' +
           ' control="current.block.answers[2].form">' +
        '</div>');
    //scope = $rootScope;
    elm = $compile($elm)(scope);
    elm2 = $compile($elm2)(scope2);
    elm3 = $compile($elm3)(scope3);
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

    it('should not exceed the defined maximum word count', function() {
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

    it('should set max_word to 500 if user exeeds that', function() {
        var isolated = elm3.isolateScope();
        $rootScope.$apply(function() {
            isolated.value = "Hendrerit aptent. Tincidunt auctor dignissim quis eget et eget. Facilisi. Curae; sagittis platea ac pretium, curae; aliquam porttitor Dolor habitasse porttitor magnis leo platea eget. Sodales nibh fermentum ullamcorper ultricies ipsum malesuada integer facilisi purus ultrices consequat habitasse, condimentum lacinia magna porta tempor, torquent nostra lacinia aliquam sapien in vehicula auctor mus, iaculis laoreet orci donec neque pretium curae; ligula feugiat donec netus lacinia. Congue. Auctor proin non est pretium ligula. Augue. Nibh scelerisque molestie felis, sit nunc fringilla. Ante. Justo sociosqu odio curabitur. Sit imperdiet, amet. Hac, risus dictum aliquet amet ultricies massa elementum rhoncus, hac senectus diam platea. Laoreet. Malesuada nisi amet neque elit pretium eros. Fusce est inceptos aliquam litora suscipit ultricies ipsum magna a ultricies justo hendrerit nisl feugiat porttitor habitant lacinia magna pellentesque curabitur dignissim arcu parturient quisque rutrum potenti volutpat lorem netus. Imperdiet sagittis inceptos. Dapibus nulla potenti condimentum pede id ullamcorper at venenatis mauris platea ullamcorper orci hendrerit ipsum neque. Porttitor. Fames litora mollis rhoncus lectus ad, pulvinar vulputate quis proin dictum rutrum sit fermentum sociis. Ut hymenaeos enim venenatis sem suspendisse vel lectus quam consectetuer habitasse proin. Libero turpis lobortis tempor tempor. Torquent elit dui enim pharetra molestie ut arcu sodales ultrices sagittis feugiat facilisi varius dapibus convallis, risus pellentesque. Nisl, ridiculus mollis, dui dis pellentesque tortor massa pede gravida nonummy aliquet cubilia nullam dolor pellentesque diam eleifend a Dictumst consectetuer urna porttitor, ultricies lacus. Semper massa. Porta convallis mus ullamcorper Pretium dictumst. Enim viverra vivamus iaculis faucibus potenti erat ipsum elementum sodales condimentum vivamus netus. Turpis venenatis sagittis duis urna praesent tristique tincidunt dapibus hac Dictumst lobortis Netus ornare ultrices phasellus auctor rhoncus nonummy nullam risus. Nisi aliquet luctus nascetur mi dolor, urna ut, viverra est, ipsum. Ante scelerisque inceptos morbi litora, aliquet lacus, aptent congue ridiculus cum mauris netus justo nulla lacus eleifend viverra torquent adipiscing neque gravida varius. Massa Lacinia odio ornare eleifend dis fringilla duis Semper consectetuer nisi turpis nullam amet facilisi. Sodales, ipsum ad. Penatibus tristique augue mi nisi integer hac Habitasse donec cubilia bibendum conubia. Rutrum fermentum, id. Parturient metus, ullamcorper. Quisque sagittis netus velit vehicula vestibulum vel metus a gravida cubilia quam orci fermentum porttitor, tristique dictumst ante elementum taciti consectetuer. Quam dis. Nostra lectus rhoncus nascetur. Interdum aenean cum conubia euismod facilisis senectus lectus quisque tincidunt ut sem purus inceptos ridiculus rutrum magnis ridiculus condimentum nostra primis commodo dignissim praesent integer condimentum nulla torquent orci. Ad. Quisque, justo neque, felis augue tincidunt. Placerat ante vehicula sollicitudin vulputate sapien. Phasellus dictum hymenaeos ultricies laoreet lorem egestas bibendum neque venenatis venenatis per viverra iaculis iaculis quisque at justo ad porta velit volutpat accumsan nam eros lacinia, sagittis taciti condimentum maecenas mollis semper nascetur maecenas sem metus penatibus faucibus urna duis turpis natoque tincidunt ligula aliquam lobortis natoque ligula, diam lobortis mollis molestie fermentum velit cursus luctus pretium tincidunt euismod. A leo quis, ac dignissim. Dis Amet elit arcu risus augue varius nostra arcu praesent cubilia dui cras convallis, volutpat est erat accumsan potenti volutpat fames lectus dude.";
        });
        var is_valid = isolated.internalControl.validate_answer();
        expect(is_valid).toBe(false);

    });

});