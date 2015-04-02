// p97.question-types module definition. This must be called first in the gulpfile
angular.module('p97.questionTypes', ['monospaced.elastic', 'google.places', 'angular-datepicker']);

angular.module('p97.questionTypes')
  .directive( 'qtLoader', function ( $compile ) {
    return {
        restrict: 'E',
        scope: { questions: '=' },
        template: "<div class='row blocks'></div>",
        controller: function ( $scope, $element ) {

            $scope.addDirectives = function() {
                /*
                Dynamically inject the question type directives into the
                DOM and then compile with Angular.
                */
                _.each($scope.questions, function(q, i){
                    q.form = {show: true};
                    if (typeof(q.value) === 'undefined') q.value = '';
                    var html = '<div class="question '+q.type+'" '+q.type+' question="questions['+i+']" value="questions['+i+'].value" control="questions['+i+'].form" ng-show="questions['+i+'].form.show"></div>';
                    var el = $compile(html)($scope);
                    $element.parent().append(el);
                });
            }
            $scope.addDirectives();
        }
    }
});