angular.module('vpApi.services', [])

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

  function post(resource, data, success, fail){
    var url = apiBase + resource + '/';
    var config = {headers: {'Authorization':'Token ' + user.token}};
    $http({url:url,
          method:'POST',
          data: data,
          headers: {'Authorization':'Token ' + user.token}
    }).success(function(data, status){
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
      post:post
  };
}])

.factory( 'FormStack', ['vpApi', function(vpApi) {

  var resource_name = 'pforms/formstack';
  var objects = [];
  
  function load(successCallback){
    vpApi.fetch(resource_name, {}, function(data, status){
      objects = data;
      successCallback(data, status)
    },
    function(data, status){
      console.log("Failed to fetch " + resource_name + ". Returned Status: " + status);
      console.log(data);
    });
  }



  function getBySlug(field, value){
    res = _.find(objects, function(obj){
      return (obj[field] === value);
    });
    return res || [];
  }


  return {
    load:load,
    get:getBySlug,
    objects:objects,

  };
}])

.factory( 'Form', ['vpApi', function(vpApi) {

  var objects = [];

  function getById(forms, field, value){
    console.log("getById")
    res = _.find(forms, function(obj){
      return (obj[field] === value);
    });
    return res || [];
  }

  return {
    get:getById,
    objects:objects
  };
}])

.factory('Question', ['vpApi', function(vpApi){
  var resource_name = 'pforms/question';
  var objects = [];

  function load(successCallback){
    vpApi.fetch(resource_name, {}, function(data, status){
      objects = data;
      successCallback(data, status)
    },
    function(data, status){
      console.log("Failed to fetch " + resource_name + ". Returned Status: " + status);
      console.log(data);
    });
  }

  function create(data, callback) {
    vpApi.post(resource_name, data, function(data, status){
      callback(data, status);
    }, function(data, status){
      console.log("Failed to create " + resource_name + ". Returned Status: " + status);
      console.log(data);
      callback(data, status);

    });
  };

  function getBySlug(field, value){
    res = _.find(objects, function(obj){
      return (obj[field] === value);
    });
    return res || [];
  }

  function cleanData(data){
    data.options = {'placeholder':''};
    data.type = parseInt(data.type);
    return data;
  }

  return {
    load:load,
    create:create,
    get:getBySlug,
    objects:objects,
    cleanData:cleanData
  };

}]);


