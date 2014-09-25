angular.module('starter.services', [])

.factory( 'vpApi', ['$http', function($http) {
  


  var user = {username:null,
              token:null,
              profile:null,
              };
  if (localStorage.getItem('token')) {
    user.token = localStorage.getItem('token');
  }
  var apiBase = 'http://localhost:8000/api/v2/';

  function login(data, success_callback, error_callback) { 
    /*
    Inputs:
        data : object with keywords username, password
    */
    console.log('I should log in');
    var url = apiBase + 'authenticate/';
    user.username = data.username;
    
    
    // $http.defaults.headers.common.Authorization = 'Token ' + user.token;
    var config = {'Authorization':'Token ' + user.token};  
    $http.post(url, data, config)
      .success(function(data, status){
        user.token = data.token;
        localStorage.setItem('token', data.token);
        success_callback(data, status);
      })
      .error(function(data, status){
        error_callback(data, status)
    });
  }
  
  function logout() {

  }

  function fetch(resource, data, success, fail){
    var url = apiBase + resource + '/';
    var config = {headers: {'Authorization':'Token ' + user.token}};
    $http.get(url, config).success(function(data, status){
      success(data, status);
    })
    .error(function(data, status){
      fail(data, status);
    });
  }


  return {
      apiBase:apiBase,
      authenticate:login,
      user:user,

      fetch:fetch,
  };
}]);
