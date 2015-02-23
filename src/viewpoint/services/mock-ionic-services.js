angular.module('mock-ionic.services', [])

.service( '$ionicLoading', [function() {
    console.log("mock $ionicLoading ");

    this.show = function(){
        console.log("mock $ionicLoading.show()");
    }

    this.hide = function(){
        console.log("mock $ionicLoading.hide()");
    }
}])

.service( '$ionicModal', ["$q", function($q) {
    console.log("mock $ionicModal");


    this.fromTemplateUrl = function(){
        return $q(function(resolve, reject){
            resolve("Fake resolve");
        })
    };
}])

.service( '$ionicPopup', ["$q", function($q) {
    console.log("mock $ionicPopup")

    this.confirm = function(){
        return $q(function(resolve, reject){
            resolve("Fake resolve");
        })
    }
}])

.service( '$ionicScrollDelegate', [function() {
    console.log("mock $ionicScrollDelegate");
}]);
