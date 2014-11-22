angular.module('vpApi.services', [])

.service( '$vpApi', ['$rootScope', '$http', 'config', function($rootScope, $http, config) {
    var obj = this;
    var apiBase = config.apiBaseUri;
    this.username = '';
    
    this._createDb = function(){
        /* 
        Creates the database and adds all the collections needed
        then saves to local storage. 
        */
        
        obj.db.addCollection('user');
        obj.db.addCollection('formstack');
        obj.db.addCollection('fsResp');
        obj.db.addCollection('formResp');
        obj.db.addCollection('blockResp');
        obj.db.addCollection('answer');

        obj.db.save();
    }

    this.getUserObj = function(){
        var user = null;
        try {
            user = obj.db.getCollection('user').find({'username':obj.username})[0];
        } catch(e) {
            console.log('[$vpApi.getUserObj()] Could not find user');
            console.log(e);
        }
        return user;
    }

    this.getToken = function(){
        user = obj.getUserObj();
        return user.token;
    }

    this.getFormstack = function(){
        var out = null;
        var user = obj.getUserObj();
        try {
            out = obj.db.getCollection('formstack').find({'slug':user.profile.allowed_formstacks[0]})[0];
        } catch(e) {
            console.log('[$vpApi.getUserObj()] Could not find formstack');
            console.log(e);
        }
        return out;

    }

    // Makes the loki database available at $vpApi.db.
    this.db = new loki(config.dbFilename);
    dbJson = localStorage.getItem(config.dbFilename);

    if (dbJson){
        this.db.loadJSON(dbJson);
    } else {
        console.log("[$vpApi] Database not found");
        console.log("[$vpApi] creating database " + config.dbFilename);
        obj._createDb();
    }
    var users = this.db.getCollection('user')

    if (users.data.length > 0 && users.data[0].username){
        this.username = users.data[0].username;
    }


    this.authenticate = function(data, success_callback, error_callback) { 
        /*
        Inputs:
            data : object with keywords username, password, stayLoginIn
        */
        console.log('[$vpApi.authenticate]');
        var url = apiBase + 'authenticate/';

        var headers = {}// {'Authorization':'Token ' + this.user.token};  
        $http.post(url, data, headers)
            .success(function(res, status){
                var users = obj.db.getCollection('user');
                var user = users.find({'username': data.username});
                if (user.length === 0){
                    users.insert({'username':data.username, token:res.token})
                } else {
                    user[0].token = res.token;
                    user[0].username = data.username;
                    users.update(user[0]);
                }
                obj.username = data.username;
                
                obj.db.save();
                console.log('broadcasting authenticated')
                
                $rootScope.$broadcast('authenticated');
                
                

                success_callback(data, status);
        })
            .error(function(data, status){
            error_callback(data, status)
        });
    }



    this.fetch  = function(resource, data, success, fail){
        var url = apiBase + resource + '/';
        var config = {headers: {'Authorization':'Token ' + this.getToken()}};
        $http.get(url, config).success(function(data, status){
          success(data, status);
        })
        .error(function(data, status){
          fail(data, status);
        });
    }

    this.post = function(resource, data, success, fail){
        var url = apiBase + resource + '/';
        var config = {headers: {'Authorization':'Token ' + this.user.token}};
        $http({url:url,
              method:'POST',
              data: data,
              headers: {'Authorization':'Token ' + this.user.token}
        }).success(function(data, status){
          success(data, status);
        })
        .error(function(data, status){
          fail(data, status);
        });
    }
}])


.service('$user', ['$rootScope', '$vpApi', '$formstack', '$profile', function($rootScope, $vpApi, $formstack, $profile){
    var obj = this;

    $rootScope.$on('authenticated', function(){
        console.log('received authenticated')
        $profile.fetch(function(){
            console.log('got profile');
            $vpApi.db.save();
            
            try {
                var formstackSlug = $vpApi.getUserObj().profile.allowed_formstacks[0];
            } catch(e){
                console.log("No allowed formstacks found.");
            }

            // Now use the allowed_formstacks to get first formstack.
            $formstack.fetchBySlug(formstackSlug, function(data, status){
                console.log('[$user] succesfully fetched formstack');
                $vpApi.db.save();
            },
            function(data, status){
                console.log('[$user] failed to fetch formstack');
                console.log(data);
            })
        }, 
        function(data, status){
            console.log('Error fetching profile.');
        });
    })
    
}])

.service( '$profile', ['$http', '$vpApi', 'config', function($http, $vpApi, config){
    var obj = this;
    var apiBase = config.apiBaseUri;

    
    this.fetch = function(successCallback, errorCallback){
        /*
        Fetches profile and updates the obj.db. DOSE NOT save to localStorage
        */ 
        var url = apiBase +'account/profile/?user__username=';
        var token = $vpApi.getToken();

        var headers = {headers: {'Authorization':'Token ' + token}};
        $http.get(url+$vpApi.username, headers)
            .success(function(data, status){
                console.log("[$profile.fetch() callback] got data");
                var user = $vpApi.getUserObj(); 
                user.profile = data[0];
                $vpApi.db.getCollection('user').update(user);
                successCallback();
            }).error(function(data, status){
                errorCallback()
            });
    };
}])


.service('$formstack', ['$vpApi', function($vpApi) {
  var obj = this;
  this.resource_name = 'pforms/formstack';


  this.fetchBySlug = function(slug, successCallback, errorCallback){
    /*
    Get the formstack from the VP2 server. 
    */

    if(HAS_CONNECTION){
      $vpApi.fetch(
        this.resource_name, 
        {'slug':slug}, 
        function(data, status){
          obj.objects = data;
          console.log("[fetchBySlug] got data");
          
          var formstacks = $vpApi.db.getCollection('formstack');
          var formstack = formstacks.find({'slug':slug});
          if (formstack.length > 0){
            formstacks.remove(formstack);
          }
          formstacks.insert(data[0]);
          successCallback(data[0], status);

        },
        function(data, status){
          console.log("Failed to fetch " + obj.resource_name + ". Returned Status: " + status);
          console.log(data);
          errorCallback(data, status)
        }
      );

    }else{
        debugger
    }

  };

}])


.service('$fsResp', ['$formstack', '$rootScope', '$answers', function($formstack, $rootScope, $answers){
    /*
        A form response is of the form
        {
            id: 
            fsSlug:
        }
    */ 

    var obj = this;
    this.resource_name = 'pforms/formstack-response';

    $rootScope.$on('answer-created', function(event, data){ 
        debugger;
    });

}])


.service('$formResp', ['$formstack', '$rootScope', '$answers', function($formstack, $rootScope, $answers){
    /*
        A form response is of the form
        {
            id: 
            fsRespId:
            fsSlug:
        }
    */ 

    var obj = this;
    this.resource_name = 'pforms/form-response';

    $rootScope.$on('answer-created', function(event, data){ 
        debugger;
    });

    
}])

.service('$blockResponse', ['$formstack', '$block', '$rootScope', '$answers', '$formResponse', function($formstack, $block, $rootScope, $answers, $formResponse){
    /*
        A block response is of the form
        {
            id:
            fsRespId:
            fsSlug:
            formRespId:
            formId:
        }
    */
    var obj = this;
    this.resource_name = 'pforms/block-response'; //This is currently client side only

    $rootScope.$on('answer-created', function(event, data){
        debugger;
    })

}])


.service( '$answers', ['$form', '$rootScope', '$filter', '$vpApi', 'config',  
               function($form, $rootScope, $filter, $vpApi, config) {
  /*
    An answer will be of the form
    {
        id:
        value:   <-- This is what the question type directive outputs.
        valueType:
        blockRespId:
        blockId:
        formRespId:
        formId:
        fsRespId:
        fsSlug:
        cupdate:
    }

  */

  var obj = this;
  this.resource_name = "pforms/answer";

}])
