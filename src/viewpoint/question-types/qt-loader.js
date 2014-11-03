// p97.question-types module definition. This must be called first in the gulpfile
angular.module('p97.questionTypes', []);

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
                    q.form = {};
                    if (typeof(q.value) === 'undefined') q.value = '';
                    var html = '<div '+q.type+' question="questions['+i+']" value="questions['+i+'].value" control="questions['+i+'].form" cid="questions['+i+'].answerCid"></div>';
                    var el = $compile(html)($scope);
                    $element.parent().append(el);
                });
            }
            $scope.addDirectives();
        }
    }
});