angular.module('p97.questionTypes')
  .directive('info', ['$http', '$templateCache', '$compile', '$sce', function($http, $templateCache, $compile, $sce){
    
        return {
            template:'',
            restrict: 'EA',

            // Scope should always look like this in all question types.
            scope: {
                question: '=', 
                value: '=',
                control: '='
            },
            link: function(scope, element, attrs) {

                scope.getContentUrl = function() {

                    if (scope.question.options.widget) {
                        return BASE_TEMPLATE_URL+'info/templates/'+scope.question.options.widget+'.html';
                    } else {
                        return BASE_TEMPLATE_URL+'info/templates/'+platform+'/info.html';
                    }                    
                }

                scope.renderHtml = function(htmlCode) {
                    return $sce.trustAsHtml(htmlCode);
                };  
                
                if (!scope.question) return;
                var options = scope.question.options;

                // This is availible in the main controller.
                scope.internalControl = scope.control || {};
                scope.internalControl.validate_answer = function(){

                    scope.errors = [];
                    
                    if (scope.value === null) scope.value = ''; //Convert to empty string to make processing easier.

                    return (scope.errors.length === 0);

                };


                scope.internalControl.clean_answer = function(){
                    // Nothing to see here.
                };

                // Compile the template into the directive's scope.
                $http.get(scope.getContentUrl(), { cache: $templateCache }).success(function(response) {
                    var contents = element.html(response).contents();
                    $compile(contents)(scope);
                });

            }
        }
    }]);