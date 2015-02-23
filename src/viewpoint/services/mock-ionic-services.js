angular.module('mock-ionic.services', [])

.service( '$ionicLoading', [function() {
    console.log("mock $ionicLoading ")
}])

.service( '$ionicModal', ["$q", function($q) {
    console.log("mock $ionicModal");


    this.fromTemplateUrl = function(){
        return $q(function(resolve, reject){
            resolve("Fake resolve");
        })
    };
}])

.service( '$ionicPopup', [function() {
    console.log("mock $ionicPopup")
}])

.service( '$ionicScrollDelegate', [function() {
    console.log("mock $ionicScrollDelegate");
}]);
