// p97.question-types module definition. This must be called first in the gulpfile
angular.module('p97.questionTypes', []);
// datetime controllers.js
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
// number controllers.js
// number directives.js

angular.module('p97.questionTypes')  // All p97 components should be under p97.
  .directive('number', function(){  // question-type directives should be the nameof the question type as defined in the Viewpoint API.


    return {
        templateUrl: BASE_URL+'number/templates/number.html',
        restrict: 'EA',

        // Scope should always look like this in all question types.
        scope: {
            question: '=', 
            answer: '=',
        },
        link: function(scope, element, attrs) {
            console.log("I made it to number link function");
            console.log(scope.question)
        }
    }
});
// textare controllers.js
// textarea directives.js

angular.module('p97.questionTypes')  // All p97 components should be under p97.
  .directive('textarea', function(){  // question-type directives should be the nameof the question type as defined in the Viewpoint API.


    return {
        templateUrl: BASE_URL+'textarea/templates/textarea.html',
        restrict: 'EA',

        // Scope should always look like this in all question types.
        scope: {
            question: '=', 
            answer: '=',
        },
        link: function(scope, element, attrs) {
            console.log("I made it to textarea link function");
        }
    }
});

// yes-no controllers.js
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
