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