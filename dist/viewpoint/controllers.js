// build timestamp: Wed Sep 02 2015 15:41:50 GMT-0700 (PDT)
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
angular.module('p97.controllers')
//angular.module('dockDashboardApp')

.controller('ProfileCtrl', function($scope, $state, $vpApi, $user, $profile, $org, $loadingModal, config, $http) {

    console.log("[ProfileCtrl]")
    $scope.user = $vpApi.user;
    $scope.config = config;

    $scope.$vpApi = $vpApi;
    $scope.showProfileForm = false;
    $scope.showOrgForm = false;

    $scope.current = {
        'profile': {},
        'org': {}
    };

    $scope.master = {
        'profile': {},
        'org': {}
    };

    $scope.loadProfile = function(){
        $scope.master.profile.id = $scope.user.profile.id;
        $scope.master.profile.email = $scope.user.profile.email;
        $scope.master.profile.firstName = $scope.user.profile.first_name;
        $scope.master.profile.lastName = $scope.user.profile.last_name;
        $scope.master.profile.username = $scope.user.profile.username;
        $scope.master.profile.cellNumber = $scope.user.profile.preferences.cellNumber;

        $scope.current.profile = angular.copy($scope.master.profile);

    };
    $scope.loadProfile();

    $scope.loadOrg = function(){
        $scope.master.org.name = $scope.user.profile.orgs[0].name;
        $scope.master.org.options = $scope.user.profile.orgs[0].options;

        $scope.current.org = angular.copy($scope.master.org);
    };
    $scope.loadOrg();


    $scope.submit = function(form){
        // Trigger validation flag.
        $loadingModal.show()
        $scope.submitted = true;

        // If form is invalid, return and let AngularJS show validation errors.
        if (form.$invalid) return;

        var service, data;
        if (form.$name === 'profileForm'){
            service = $profile;
            data = $scope.current.profile;
        } else if(form.$name === 'orgForm') {
            service = $org;
            data = $scope.current.org;
        }
       
        
        service.update(data)
            .then(function(data, status){
                if (form.$name === 'profileForm'){
                    $scope.loadProfile();
                    $scope.showProfileForm = false;
                } else if(form.$name === 'orgForm') {
                    $scope.loadOrg();
                    $scope.showOrgForm = false;
                }
                $loadingModal.hide();

            }, function(data, status){
                console.log("There were errors.")
                $loadingModal.hide();
            });

    }

    $scope.wtf = {};
    $scope.wtf.countries = [
        {
            "name": "USA",
            "code": "USA"
        },
        {
            "name": "Indonesia",
            "code": "IND"
        },
        {
            "name": "Country 2",
            "code": "CT2"
        }
    ]

})