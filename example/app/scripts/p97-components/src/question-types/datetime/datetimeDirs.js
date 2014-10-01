// datetime directives.js

angular.module('p97.questionTypes')
  .directive('datetime', function(){  // question-type directives should be the nameof the question type as defined in the Viewpoint API.

    return {
        templateUrl: BASE_URL+'datetime/templates/datetime.html',
        restrict: 'EA',

        // Scope should always look like this in all question types.
        scope: {
            question: '=', 
            answer: '=',
        },
        link: function(scope, element, attrs) {
            console.log("I made it to datetime link function");
            console.log(scope.question)
        }
    };
});