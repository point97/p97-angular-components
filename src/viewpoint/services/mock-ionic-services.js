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




.service('$loadingModal', [ '$modal', function($modal){
    /*
        This is the angular strap loading modal.
    */
    var obj = this;

    obj.$modal = $modal({
        template: 'views/partials/loading-modal.html',
        container: "body",
        backdrop: "static",
        placement: 'center',
        keyboard: false,
        show: false
    });

    obj.show = function(){
        obj.$modal.$promise.then(function() {
            obj.$modal.show();
        });
    }

    obj.hide = function(){
        obj.$modal.hide();
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

angular.module('ionic-timepicker', [], function(){
    // I'm just here for looks.
})