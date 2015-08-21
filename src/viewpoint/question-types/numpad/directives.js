angular.module('p97.questionTypes')  // All p97 components should be under p97.
  .directive('numpad', ['$http', '$templateCache', '$compile', '$sce', function($http, $templateCache, $compile, $sce){  // question-type directives should be the nameof the question type as defined in the Viewpoint API.


    return {
        template: '',
        restrict: 'EA',

        // Scope should always look like this in all question types.
        scope: {
            question: '=', 
            value: '=',
            control: '='
        },
        link: function(scope, element, attrs) {
            if (!scope.question) return;
            var options = scope.question.options;
            
            scope.getContentUrl = function() {
                if(scope.question.options.widget)
                    return BASE_TEMPLATE_URL+'numpad/templates/'+scope.question.options.widget+'.html';
                else
                    return BASE_TEMPLATE_URL+'numpad/templates/'+platform+'/numpad.html';
            }

            scope.renderHtml = function(htmlCode) {
                return $sce.trustAsHtml(htmlCode);
            };

            scope.keypad = [['1', '2', '3'],['4', '5', '6'],['7', '8', '9'],['0', '.', 'DEL']];
            
            //check for previous value and display
            (scope.question.value !== "") ? scope.display = [scope.question.value] : scope.display = ['0'];

            //fires on keypress
            scope.input = function(item) {

                //if a decimal is already included, ignore and return previous answer
                if (scope.display !== '0' && _.contains(scope.display, ".") && item === ".") {
                    return scope.display
                }

                if (item == 'DEL') { 
                    scope.remove();
                } else {
                    //checks if '0' is the starting item
                    (scope.display == '0' && /[0-9]/.test(item)) ? scope.display = [item] : scope.display.push(item);
                }
            };

            //removes last keypress
            scope.remove = function() {
                scope.display.pop();
                if (scope.display.length == 0) scope.display = ['0'];
            };

            scope.compute = function() {
                 return  Number(scope.display.join(''));
            };
            
            // This is availible in the main controller.
            scope.internalControl = scope.control || {};
            
            scope.internalControl.validate_answer = function(){
                scope.errors = []
                return (scope.errors.length === 0);
            };

            scope.internalControl.clean_answer = function(){
                
            };

            // Compile the template into the directive's scope.
            $http.get(scope.getContentUrl(), { cache: $templateCache }).success(function(response) {
                var contents = element.html(response).contents();
                $compile(contents)(scope);
            });

            scope.$watch('compute()', function(keystroke){
                scope.value = keystroke;
            });

            scope.$on("reset-numpad", function(arg){
                while(scope.display.length >0 && scope.display[0] != '0'){
                    scope.remove();
                }
            });
        }
    }
}]);