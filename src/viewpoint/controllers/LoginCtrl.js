angular.module('p97.controllers')
//angular.module('dockDashboardApp')

.controller('LoginCtrl', function($scope, $state, $vpApi, $user, config, $http) {

    console.log("[LoginCtrl]")
    $scope.user = $vpApi.user;
    $scope.config = config;
    
    $scope.loginData = {
        username: '',
        password: '',
        stayLoggedIn: config.stayLoggedIn,
    };


    $scope.authenticate = function(nextState){

        $vpApi.authenticate($scope.loginData, 
            function(data, status){
                if (status === 1) {
                    // User autneticated and had an accecpted apps list. 
                    
                    Raven.setUser({
                        username:$vpApi.user.username,
                        email:$vpApi.user.profile.email,
                        id: $vpApi.user.profile.user,
                        token: $vpApi.token,
                        app_slug : $vpApi.appSlug
                    });
                    Raven.captureMessage('User autenticated', {'extra': $vpApi.user, 'tags':{'level':'log'} });
                    $state.go(nextState);
                } else if (status === 2){
                    // No allowed apps for this user.
                    $scope.loginData = {
                        username: '',
                        password: '',
                        stayLoggedIn: config.stayLoggedIn,
                    };
                    $scope.errorMsg = "You do not have access to this application.";
                } else if (status === 3){
                    $scope.errorMsg = "We could not find the application.";
                }
                                
            },
            function(data, status){
                $scope.loginData = {
                    username: '',
                    password: '',
                    stayLoggedIn: config.stayLoggedIn,
                };
                if (status === 0){
                    $scope.errorMsg = "Could not connect to server. Please try again.";
                } else if (status === 400) {
                    $scope.errorMsg = "Invalid username or password. Please try again.";
                } else {
                    $scope.errorMsg = "Unkown error. Please try again.";

                }
                
                console.log("Authentication Status")
                console.log(status);
                console.log(data)

            }
        ); // end authenticate
    }
});