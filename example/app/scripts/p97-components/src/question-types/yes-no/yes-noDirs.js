// yes-no controllers.js

angular.module('p97.questionTypes')  // All p97 components should be under p97.
  .directive('yesNo', function(){  // question-type directives should be the nameof the question type as defined in the Viewpoint API.


    return {
        templateUrl: BASE_URL+'yes-no/templates/yes-no.html',
        restrict: 'EA',

        // Scope should always look like this in all question types.
        scope: {
            question: '=', 
            answer: '=',
        },
        link: function(scope, element, attrs) {
            console.log("I made it to yes-no link function");
            console.log(scope.question)
        }
    }
});
