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

                    if (scope.question.hasOwnProperty('options') && scope.question.options.templateUrl) {
                        return BASE_URL+'info/templates/'+scope.question.options.templateUrl+'.html';
                    } else {
                        return BASE_URL+'info/templates/ionic/info.html';
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
                    
                    if (scope.value === null) scope.value = ''; //Convert to empty string to make processing easier.

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