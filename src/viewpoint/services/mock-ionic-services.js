angular.module('mock-ionic.services', [])

.service( '$ionicLoading', [ "$modal", function($modal) {
    console.log("mock $ionicLoading ");

    obj = this;
    obj.modal = false;

    this.show = function(){
        if (platform === "web"){
            obj.modal = $modal({
              content: "",
              template: "/templates/web/partials/loading-modal.html",
              backdrop: 'static',
              show: true,
              position: 'center'
            });
        }
        
    }

    this.hide = function(){
        if (platform === "web"){
            if (obj.modal) {
                obj.modal.hide();
            }
            
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
