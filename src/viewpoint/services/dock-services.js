angular.module('dock.services', [])
.service('$choiceList', ['$vpApi', '$formstack', '$http', '$q', function($vpApi, $formstack, $http, $q){
  var obj = this;
  obj.species = [];
  obj.sites = [];

  obj.fetch = function(tableName){
      var deferred = $q.defer();
      var orgSlug = $vpApi.user.profile.orgs[0].slug;

      var params = {
          orgSlug: orgSlug,
      };
      $vpApi.fetch('dock/' + tableName, params, function(data, status){
          obj[tableName] = data;
          deferred.resolve(data, status);
      }, function(data, status){
          console.log("[choiceList.fetch] failed", data);
          deferred.reject(data, status);
      });
      return deferred.promise;
  }
}])

.service('$surveyor',['$vpApi', '$q', function($vpApi, $q){
    var obj = this;

    this.save = function(data){
        /*
        Updates a user's profile. 
        */

        var defer = $q.defer();
        var method;
        var resource = 'dock/surveyor';
        if (data.id === undefined) {
            method = 'post';
        } else {
            method = 'patch';
            resource = resource +'/'+ data.id;
        }
        $vpApi[method](resource, data, function(data, status){
            defer.resolve(data, status);
        }, function(data, status){
            defer.reject(data, status)
        })

        return defer.promise;
    }
}])

