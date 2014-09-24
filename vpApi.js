angular.module('starter.services', [])

.factory( 'vpApi', ['$http', function($http) {
  
  var user = null;
  var apiBase = 'http://localhost:8000/api/v2/';

  function login(data, success_callback, error_callback) { 
    /*
    Inputs:
        data : object with keywords username, password
    */
    console.log('I should log in');
    var url = apiBase + 'authenticate/';
    $http.post(url, data)
    .success(function(data, status){
      user = data;
      console.log("In post")
      success_callback(data, status);
    })
    .error(function(data, status){
      error_callback(data, status)
    });
  }
  
  function logout() {

  }



  return {
      authenticate:login,
      user:user
  };
}]);
