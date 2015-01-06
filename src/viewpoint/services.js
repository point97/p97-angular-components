angular.module('vpApi.services', [])

.service( '$vpApi', ['$rootScope', '$http', 'config', function($rootScope, $http, config) {
    var obj = this;
    var apiBase = config.apiBaseUri;
    this.username = '';
    this.user = {};
    this.users;
    this.dbLoaded = false
    this.dbinit = function(initCallback){
        /*
            Loads or creates the database. 

            Sets

            this.db
            this.user - A user object with keys: username, token
        */

        // Makes the loki database available at $vpApi.db.
        obj.db = data.db;
        obj.user = data.user;
        obj.users = data.db.getCollection('user');
        obj.dbLoaded = true;
        return;

        if (obj.dbLoaded === true) { 
            initCallback();
            return;
        }

        obj.loadHandler = function(){
            console.log("")
            obj.users = obj.db.getCollection('user');

            if (obj.users && obj.users.data.length > 0 && obj.users.data[0].username){
                obj.user = obj.users.data[0];
            } else {
                console.log('[loadDatabase] Could not find users collection');
                obj._createDb();
            }
            obj.dbLoaded = true;
            $rootScope.$broadcast('db_loaded');
            console.log('[loadDatabase] done');
            initCallback();

        };

        var idbAdapter = new lokiIndexedAdapter('vpsurvey');
        obj.db = new loki(config.dbFilename, { 
            'adapter': idbAdapter,
            'autoload': true,
            'autoloadCallback': obj.loadHandler
        });
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
                var users = obj.users.find({'username': data.username});
                if (users.length === 0){
                    user = obj.users.insert({'username':data.username, token:res.token})
                } else {
                    user = users[0];
                    user.token = res.token;
                    user.username = data.username;
                    obj.users.update(user);
                }
                obj.user = user;
                
                obj.db.save();
                localStorage.setItem('user', JSON.stringify(obj.user));
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
        var url = apiBase +'account/info/?user__username=';
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

    this.formRepeatItem;  // TODO Find a better place for this. Mayeb a state service, will probably want the rest of the state stored to.


    this._fetchSuccess = function(data, status){
        obj.objects = data;
        console.log("[$formstack.fetchSuccess] got data, now updating formstack collection");
        var formstacks = $vpApi.db.getCollection('formstack');
        var formstack = formstacks.find({'slug':data[0].slug});
        if (formstack.length > 0){
            formstacks.remove(formstack);
        }
        formstacks.insert(data[0]);
    };

    this._fetchFail = function(data, status){
        console.log("Failed to fetch " + obj.resource_name + ". Returned Status: " + status);
        console.log(data);
    }

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

    }; // fetchBySlug

    this.updateBySlug = function(slug, success, error) {
        /*
        Inputs:
            slug - [String]

            success - [Function] the success callback. This will called with arguements 
                        formstack, status from the $http.get. 
            
            error -  [Fucntion] the error callback. This will be called with arguments 
                         data, status from the $http.get
        */

        console.log("[$formstack.fetchBySlug] About to fetch formstack.");
        var data = {'slug':slug};
        
        $vpApi.fetch(this.resource_name, data, 
            function(data, status){
                obj._fetchSuccess(data, status);
                success(data[0]);
            },
            function(data, status){
                obj._fetchFail(data, status);
                error(data, status);
            }
        );
    };

}])


.service('$fsResp', ['$vpApi', '$rootScope', function($vpApi, $rootScope){
    /*
        A form response is of the form
        {
            id: 
            fsSlug:
        }
    */ 

    var obj = this;
    this.resource_name = 'pforms/formstack-response';

    $rootScope.$on('db_loaded', function(e){
        console.log('$fsResp received db_loaded')
        this.objects = $vpApi.db.getCollection('fsResp');
    })
    


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

    //this.objects = $vpApi.db.getCollection('formResp');


    
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


.service('$mediacache', ['$vpApi', '$formstack', '$http', function($vpApi, $formstack, $http){
    var obj = this;
    obj.isCached = false;
    

    this.run = function(){
        /* 
        This should run when the app first loads. 

        It uses getFileNames to return  alist of file names to
        request from the server and caches them in a Colleciton named
        'media' with a keywords 'filename' and 'data'
        

        */ 
        var fnames = obj.getFilenames();
        // Cache all geojsonChoices
        _.each(fnames, function(fname){
            $http({ 
                method: 'GET',
                withCredentials: true,
                url: fname
            }).success(function(data) {
                // Save this to persistent storage

                var medias = $vpApi.db.getCollection('media');
                var entry = medias.find({'fname':fname});
                if (entry.length > 0){
                    entry.cupdate = $vpApi.getTimestamp();
                    medias.update(entry);
                } else {
                    entry = {
                        'fname':fname,
                        'data':data,
                        'cupdate': $vpApi.getTimestamp()
                    }
                    medias.insert(entry);
                }
                $vpApi.db.save();

            }).error(function(data, status){
                console.log("Could not load media file ")
            });
        });
    };

    this.getFilenames = function(){
        // Get loop over formstack and get a list of files names to cache
        var fs = $vpApi.getFormstack();
        var fnames = [];
        _.each(fs.forms, function(form){
            _.each(form.blocks, function(block){
                _.each(block.questions, function(q){
                    if (q.options.geojsonChoices && q.options.geojsonChoices.url){
                        console.log("[getFilenames] found media file "+q.options.geojsonChoices.url);
                        fnames.push(q.options.geojsonChoices.url);
                    }
                }); // End questions loop
            }); // End block loop
        }); // End forms loop
        console.log("[getFilenames] File to cache: ");
        console.log(fnames);
        return fnames;
    }

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
