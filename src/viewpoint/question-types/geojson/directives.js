angular.module('p97.questionTypes')
.directive('geojson', ['$q', '$http', '$templateCache', '$compile', '$timeout', '$window', '$ionicLoading', '$sce',
               function($q, $http, $templateCache, $compile, $timeout, $window, $ionicLoading, $sce){
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
            // $ionicLoading.show({
            //     template: '<i class="icon ion-loading-a" style="font-size: 32px"></i>'
            // });
            scope.errors = [];

            scope.getContentUrl = function() {
                if(scope.question.options.widget)
                    return BASE_TEMPLATE_URL+'geojson/templates/'+scope.question.options.widget+'.html';
                else
                    return BASE_TEMPLATE_URL+'geojson/templates/'+platform+'/geojson.html';
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
                out = true;
                if (scope.question.options.required === true) {
                    if (scope.value.length === 0) {
                        out = false;
                        scope.errors.push("A location is required.");
                    } else {
                        var feature = JSON.parse(scope.value);
                        if (feature.features.length === 0){
                            out = false;
                            scope.errors.push("A location is required.");
                        }
                    }
                    
                }
                return out;
            };
            
            scope.internalControl.clean_answer = function(){}

            // Compile the template into the directive's scope.
            $http.get(scope.getContentUrl(), { cache: $templateCache }).success(function(response) {
                var contents = element.html(response).contents();
                $compile(contents)(scope);
                
            });

            
        } // End link
    } // end return
}]);
