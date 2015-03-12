angular.module('mock-ionic.services', [])

.service( '$ionicLoading', [ "blockUI", "$timeout", function(blockUI, $timeout) {
    console.log("mock $ionicLoading ");

    obj = this;

    var myBlockUI = blockUI.instances.get('myBlockUI'); 

    this.show = function(func){
        if (platform === "web"){
            myBlockUI.reset();
           myBlockUI.start();
        }    
    }

    this.hide = function(){
        if (platform === "web"){
            $timeout(function(){
                myBlockUI.stop();
            }, 2000);
        }
        
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
