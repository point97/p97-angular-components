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

.service('$formstack', ['vpApi', '$localStorage', function(vpApi, $localStorage) {
  var obj = this;
  this.resource_name = 'pforms/formstack';
  this.objects = [];


  this.loadBySlug = function(slug, successCallback){
    /*
    Get the formstack from the VP2 server. 
    */
    vpApi.fetch(this.resource_name, {'slug':slug}, function(data, status){
      obj.objects = data;
      console.log("[loadBySlug] got data");
      console.log(data);

      $localStorage.setObject('formstack', data[0]);
      successCallback(data[0], status);

    },
    function(data, status){
      console.log("Failed to fetch " + obj.resource_name + ". Returned Status: " + status);
      console.log(data);
    });
  };

  this.getBySlug = function(field, value){
    res = _.find(this.objects, function(obj){
      return (obj[field] === value);
    });
    return res || [];
  }

  this.fetchUpdates = function(slug, callback){
    /*
    Fetches update since last times stamp.

    TODO make this work, right now it just gets the formstack.
    */
    console.log("[fetchUpdates] getting data");

    this.loadBySlug(slug, callback);
  }

  this.getFormBySlug = function(slug){
    var form = _.find(this.objects[0].forms, function(obj){
      return (obj.slug === slug);
    });
    return form;
  }

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

}])

.factory('$localStorage', ['$window', function($window) {
  return {
    set: function(key, value) {
      $window.localStorage[key] = value;
    },
    get: function(key, defaultValue) {
      return $window.localStorage[key] || defaultValue;
    },
    setObject: function(key, value) {
      $window.localStorage[key] = JSON.stringify(value);
    },
    getObject: function(key) {
      return JSON.parse($window.localStorage[key] || '{}');
    }
  }
}]);


