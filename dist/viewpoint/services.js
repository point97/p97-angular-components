angular.module('vpApi.services', [])

.service( '$vpApi', ['$rootScope', '$http', 'config', function($rootScope, $http, config) {
    var obj = this;
    var apiBase = config.apiBaseUri;
    this.username = '';
    this.user = {};
    this.users;

    this.dbinit = function(){
        /*
            Loads or creates the database. 

            Sets

            this.db
            this.user
        */
        // Makes the loki database available at $vpApi.db.
        this.db = new loki(config.dbFilename);
        var dbJson = localStorage.getItem(config.dbFilename);

        if (dbJson){
            this.db.loadJSON(dbJson);
        } else {
            console.log("[$vpApi] Database not found");
            console.log("[$vpApi] creating database " + config.dbFilename);
            obj._createDb();
        }
        this.users = this.db.getCollection('user');

        if (this.users.data.length > 0 && this.users.data[0].username){
            this.user = this.users.data[0];

        }
    }

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


    this.getFormstack = function(){
        var out = null;
        try {
            out = obj.db.getCollection('formstack').find({'slug':obj.user.profile.allowed_formstacks[0]})[0];
        } catch(e) {
            console.log('[$vpApi.getFormstack()] Could not find formstack');
            console.log(e);
        }
        return out;

    }

    this.getTimestamp = function(){
        return new Date().toISOString();
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
                var user = obj.users.find({'username': data.username});
                if (user.length === 0){
                    user = obj.users.insert({'username':data.username, token:res.token})
                } else {
                    user[0].token = res.token;
                    user[0].username = data.username;
                    obj.users.update(user[0]);
                }
                obj.user = user;
                
                obj.db.save();
                console.log('broadcasting authenticated')
                
                $rootScope.$broadcast('authenticated', {onSuccess: success_callback});
        })
            .error(function(data, status){
            error_callback(data, status)
        });
    }



    this.fetch  = function(resource, data, success, fail){
        var url = apiBase + resource + '/';
        var config = {headers: {'Authorization':'Token ' + this.user.token}};
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


    this.dbinit();
}])


.service('$user', ['$rootScope', '$vpApi', '$formstack', '$profile', function($rootScope, $vpApi, $formstack, $profile){
    var obj = this;

    $rootScope.$on('authenticated', function(event, args){
        $profile.fetch(function(){
            console.log('[$user] got profile');
            $vpApi.db.save(); // This is to save the profile to local storage.
            
            try {
                var formstackSlug = $vpApi.user.profile.allowed_formstacks[0];
            } catch(e){
                console.log("No allowed formstacks found.");
                debugger
            }

            // Now use the allowed_formstacks to get first formstack.
            $formstack.fetchBySlug(formstackSlug, function(data, status){
                console.log('[$user] succesfully fetched formstack');
                $vpApi.db.save();
                args.onSuccess();
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
        var token = $vpApi.user.token;

        var headers = {headers: {'Authorization':'Token ' + token}};
        console.log("[$profile.fetch()] About to fetch profile");
        $http.get(url+$vpApi.user.username, headers)
            .success(function(data, status){
                console.log("[$profile.fetch() callback] got data");
                $vpApi.user.profile = data[0];
                $vpApi.users.update($vpApi.user);
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
      console.log("[$formstack.fetchBySlug] About to fetch formstack.");
      $vpApi.fetch(
        this.resource_name, 
        {'slug':slug}, 
        function(data, status){
          obj.objects = data;
          console.log("[$formstack.fetchBySlug] got data");
          
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


.service('$fsResp', ['$vpApi', function($vpApi){
    /*
        A form response is of the form
        {
            id: 
            fsSlug:
        }
    */ 

    var obj = this;
    this.resource_name = 'pforms/formstack-response';

    this.objects = $vpApi.db.getCollection('fsResp');

    this.objects.all = function(){
        return this.data; // This this is a reference to the loki collection
    }

    this.delete = function(fsRespId){
        var fsResp = obj.objects.get(fsRespId);
        obj.objects.remove(fsResp);


        var formResps = $vpApi.db.getCollection('formResp').find({'fsRespId': fsRespId});
        var blockResps = $vpApi.db.getCollection('blockResp').find({'fsRespId': fsRespId});
        var answers = $vpApi.db.getCollection('answer').find({'fsRespId': fsRespId});


        console.log("Deleting " + formResps.length + " form responses");
        _.each(formResps, function(resp){
            $vpApi.db.getCollection('formResp').remove(resp);
        });

        console.log("Deleting " + blockResps.length + " block responses");
        _.each(blockResps, function(resp){
            $vpApi.db.getCollection('blockResp').remove(resp);
        });
        
        console.log("Deleting " + answers.length + " answers")
        _.each(answers, function(resp){
            $vpApi.db.getCollection('answer').remove(resp);
        });

        $vpApi.db.save();
    }

}])


.service('$formResp', ['$vpApi', function($vpApi){
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

    this.objects = $vpApi.db.getCollection('formResp');

    this.objects.all = function(){
        return this.data; // This this is a reference to the loki collection
    }
    
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

.service('$tilecache', ['$vpApi', '$formstack', function($vpApi, $formstack){
    /*
    Handles tiles caching.
    */

    var obj = this;
    this.regions = [];

    this.isCached = function(){
        var rs = localStorage.getItem('tilesCached');
        var out = (rs === 'true') ? true : false;
        return out;

    }
    this.getMaxCacheZoom = function(){
        var fs = $vpApi.getFormstack();
        var mapForm = _.find(fs.forms, function(form){
            return (form.options.type === 'map-form');
        })

        if (mapForm) {
            return mapForm.options.maxCacheZoom;
        } else {
            return null;
        }

    }

    this.getRegions = function(){
        /* 
        Look for forms with Regions. 
        Returns the list of regions or an empty list.
        */
        console.log("[$tilecache.getRegions()] WTF");
        out = [];
        
        var fs = $vpApi.getFormstack();
        
        _.each(fs.forms, function(form){
            if (form.type === 'map-form' && form.options.regions) {
                out = _.uniq( out.concat(form.options.regions) );
            }
        console.log("[$tilecache.getRegions()] Found " + out.length + " regions");
        });
        obj.regions = out;
        return out;
    }

    this.getTileSources = function(){
        /* 
        Look for forms with regions. 
        Returns the list of regions or an empty list.
        */
        console.log("[$tilecache.getTileSources()] WTF");
        out = [];
        
        var fs = $vpApi.getFormstack();
        
        _.each(fs.forms, function(form){
            if (form.type === 'map-form' && form.options.tileSources) {
                out = _.uniq( out.concat(form.options.tileSources) );
            }
        console.log("[$tilecache.getTileSources()] Found " + out.length + " regions");
        });
        obj.tileSources = out;
        return out;
    }


    this.loadRegions = function(onSuccess, onError){
        if (obj.regions.length === 0) {
            obj.getRegions();
            if (obj.regions.length === 0);
            return
        }
        var maxZoom = obj.getMaxCacheZoom();

        var nbTiles = obj.offlineLayer.calculateNbTiles(maxZoom, obj.regions);
        if (nbTiles < 10000) {
            console.log("Will be saving: " + nbTiles + " tiles")
            obj.offlineLayer.saveRegions(obj.regions, maxZoom, 
              function(){
                console.log('[saveRegions] onStarted');

              },
              function(){
                console.log('[saveRegions] onSuccess');
                localStorage.setItem('tilesCached', 'true');
                onSuccess();
              },
              function(error){
                console.log('onError');
                console.log(error);
                onError();
              })
        } else {
            alert("You are trying to save " + nbTiles + " tiles. There is currently a limit of 10,000 tiles.");
        }

    } // end loadRegions.

    this.run = function(success, error){
        console.log("[$tilecache.run()]");

        // These need to be passed in from form.options
        // var mapquestUrl = 'http://{s}.mqcdn.com/tiles/1.0.0/osm/{z}/{x}/{y}.png'
        // var subDomains = ['otile1','otile2','otile3','otile4']
        // var mapquestAttrib = 'Data, imagery and map information provided by <a href="http://open.mapquest.co.uk" target="_blank">MapQuest</a>, <a href="http://www.openstreetmap.org/" target="_blank">OpenStreetMap</a> and contributors.'
        
        var tileSource = obj.getTileSources()[0];


        onError = function(errorType, errorData1, errorData2){
            /*
                Fires when $tilecache errors out during tile caching.
            */
            console.log("[$tilecache.run.onError()] ");
            localStorage.setItem('tilesCached', 'false');
            console.log(errorType)
            console.log(errorData1)
            console.log(errorData2)
            error();
        }


        // Initalize a map
        var map = L.map('cache-map').setView([-2.9, -79], 13);
        var options = { 
            map: map,
            maxZoom: 12, 
            attribution: tileSource.attrib, 
            dbOnly: true, 
            onReady: function(){console.log("onReady for what?")}, // Not sure what these do
            onError: function(){console.log("onError for what?")},  // Not sure what this does
            storeName:tileSource.storeName, 
            dbOption:"WebSQL"  // "IndexedDB"
        }
        obj.offlineLayer = new OfflineLayer( tileSource.url, options);
        obj.loadRegions(success, error);
    };

    clearTiles = function(){
        console.log('clearing tiles...');
        obj.offlineLayer.clearTiles(
            function(){
                console.log('[clearTiles] success')
            },function(error) {
                console.log('[clearTiles] fail')
            }
        );
    }
}])
