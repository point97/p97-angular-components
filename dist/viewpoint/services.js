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
            obj.users = obj.db.getCollection('user');

            if (obj.users && obj.users.data.length > 0 && obj.users.data[0].username){
                obj.user = obj.users.data[0];
            } else {
                obj._createDb();
            }
            obj.dbLoaded = true;
            $rootScope.$broadcast('db_loaded');
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
            console.error('[$vpApi.getFormstack()] Could not find formstack');
            console.log(e);
        }
        return out;

    }

    this.getTimestamp = function(){
        return new Date().toISOString();
    }

    this.serialize = function(obj) {
        var str = [];
        for(var p in obj)
        if (obj.hasOwnProperty(p)) {
          str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
        }
        return str.join("&");
    }

    this.authenticate = function(data, success_callback, error_callback) { 
        /*
        Inputs:
            data : object with keywords username, password, stayLoginIn
        */
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
                $rootScope.$broadcast('authenticated', {onSuccess: success_callback});
        })
            .error(function(data, status){
            error_callback(data, status)
        });
    }


    this.fetch  = function(resource, data, success, fail){

        var url = apiBase + resource + '/';
        var qs = this.serialize(data);
        url += "?" + qs;

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
            $vpApi.db.save(); // This is to save the profile to indexedDB.
            
            allowedFormstacks = $vpApi.user.profile.allowed_formstacks;
            if (allowedFormstacks.length > 0) {
                formstackSlug = allowedFormstacks[0];
            } else {
                console.error("There are no allowed formstacks for this user.");
                // TODO Handle the no formstack case.
            }
            

            // Now use the allowed_formstacks to get first formstack.
            $formstack.fetchBySlug(formstackSlug, function(data, status){
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
        $http.get(url+$vpApi.user.username, headers)
            .success(function(data, status){
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
          $vpApi.fetch(
            this.resource_name, 
            {'slug':slug}, 
            function(data, status){
                obj.objects = data;

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
        this.objects = $vpApi.db.getCollection('fsResp');
    })
    


    this.delete = function(fsRespId){
        
        var fsResp = obj.objects.get(fsRespId);
        obj.objects.remove(fsResp);


        var formResps = $vpApi.db.getCollection('formResp').find({'fsRespId': fsRespId});
        var blockResps = $vpApi.db.getCollection('blockResp').find({'fsRespId': fsRespId});
        var answers = $vpApi.db.getCollection('answer').find({'fsRespId': fsRespId});


        _.each(formResps, function(resp){
            $vpApi.db.getCollection('formResp').remove(resp);
        });

        _.each(blockResps, function(resp){
            $vpApi.db.getCollection('blockResp').remove(resp);
        });
        
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
                        fnames.push(q.options.geojsonChoices.url);
                    }
                }); // End questions loop
            }); // End block loop
        }); // End forms loop
        fnames = _.uniq(fnames);
        console.log("[getFilenames] Files to cache: ");
        console.log(fnames);
        return fnames;
    }

}])

.service('$tilecache', ['$vpApi', '$formstack', '$timeout', function($vpApi, $formstack, $timeout){
    /*
    Handles tiles caching.
    */

    var obj = this;
    this.regions = [];
    this.cacheTimer = {'start':null, 'stop':null, 'elasped':null};


    this.isCached = function(){
        var rs = localStorage.getItem('tilesCached');
        var out = (rs === 'true') ? true : false;
        return out;

    }
    this.getMaxCacheZoom = function(){
        /*
        returns the options.maxCacheZoom from the first map-form it finds in forms.
        */ 
        var out;
        var fs = $vpApi.getFormstack();
        var mapForm = _.find(fs.forms, function(form){
            return (form.type === 'map-form');
        })

        if (mapForm) {
            out =  mapForm.options.maxCacheZoom;
        } else {
            out =  null;
        }
        return out;
    }

    this.getRegions = function(){
        /* 
        Look for forms with Regions. 
        Returns the list of regions or an empty list.
        */
        
        var out = [];
        var fs = $vpApi.getFormstack();
        
        _.each(fs.forms, function(form){
            if (form.type === 'map-form' && form.options.regions) {
                out = _.uniq( out.concat(form.options.regions) );
            }
        });
        obj.regions = out;
        return out;
    }

    this.getTileSources = function(){
        /* 
        Look for forms with regions. 
        Returns the list of regions or an empty list.
        */
        
        var out = [];
        var fs = $vpApi.getFormstack();
        
        _.each(fs.forms, function(form){
            if (form.type === 'map-form' && form.options.tileSources) {
                out = _.uniq( out.concat(form.options.tileSources) );
            }
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

        console.log("Will be saving: " + nbTiles + " tiles")
        obj.offlineLayer.saveRegions(obj.regions, maxZoom, 
          function(){
            console.log('[saveRegions] onStarted');

          },
          function(){
            console.log('[saveRegions] onSuccess');
            obj.cacheTimer.stop = new Date();
            obj.cacheTimer.elasped = obj.cacheTimer.stop - obj.cacheTimer.start;
            console.log("Cache timer elapsed time (min): " + obj.cacheTimer.elasped/1000/60)

            localStorage.setItem('tilesCached', 'true');
            onSuccess();
          },
          function(error){
            console.log('onError');
            console.log(error);
            onError();
          })


    } // end loadRegions.

    this.run = function(success, error){
        obj.cacheTimer.start = new Date();
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
            maxZoom: obj.getMaxCacheZoom(), 
            attribution: tileSource.attrib,
            subdomains: tileSource.subdomain, 
            dbOnly: true, 
            onReady: function(){console.log("onReady for what?")}, // Not sure what these do
            onError: function(){console.log("onError for what?")},  // Not sure what this does
            storeName:tileSource.storeName,  // this is the objectStore name. 
            dbOption:"IndexedDB" // "WebSQL"
        }
        obj.offlineLayer = new OfflineLayer(tileSource.url, options);
        $timeout(function(){
            obj.loadRegions(success, error);
        }, 1000);
        
    };

    this.clearTiles = function(){
        /*
        Depracted 1/11/2015. Do not use
        */
        console.log('clearing tiles...');
        obj.offlineLayer.clearTiles(
            function(){
                console.log('[clearTiles] success')
            },function(error) {
                console.log('[clearTiles] fail')
            }
        );
    }


    this.clearTilesDb = function(){
        /*
        Use this to clear the tiles database from indexedDB
        */

        tilesSources = obj.getTileSources();


        osTableName = tilesSources[0].storeName;
        dbName = "IDBWrapper-" + osTableName;
        

        var openRequest = window.indexedDB.open(dbName, 1); //version used
        openRequest.onerror = function (e) {
            console.log("[openTilesDb] Database error: " + e.target.errorCode);
        };
        openRequest.onsuccess = function (event) {
            
            window.db = openRequest.result;
            console.log("[openTilesDb] Opened "+dbName+" with dataStores");
            console.log(window.db.objectStoreNames);

            var store = window.db.transaction(osTableName, "readwrite").objectStore(osTableName);
                      
             store.clear().onsuccess = function (event) {
                localStorage.removeItem("tilesCached");
                console.log('Finished clearing records');
            };
        };
    };
}])

angular.module('survey.services', [])

.factory('$formUtils', ['$vpApi', '$location', function($vpApi, $location) {
    var obj = this;
    
    setState = function(scope, state, stateParams){
        scope.current = {
            fsResp: null,
            
            form: null,
            formIndex: null,
            formResp: null,

            block: null,
            blockIndex: null,
            blockResp: null,

            qIndex: null

        };
        // Getting loki Collection for queries
        scope.formstack = $vpApi.getFormstack();
        scope.fsResps = $vpApi.db.getCollection('fsResp');
        scope.formResps = $vpApi.db.getCollection('formResp');
        scope.blockResps = $vpApi.db.getCollection('blockResp');
        scope.answers = $vpApi.db.getCollection('answer');
        scope.medias = $vpApi.db.getCollection('media');


        scope.forEach = [];  // The foreach items for repeatable questions
        if (stateParams.fsRespId === 'new') {
            // Set the current form and block
            scope.current.form = scope.formstack.forms[0];
            scope.current.formIndex = 0;
            
            scope.current.block = scope.formstack.forms[0].blocks[0];
            scope.current.blockIndex = 0;
        } else {
            // Set current fsResp
            scope.current.fsResp = scope.fsResps.get(parseInt(stateParams.fsRespId, 10));
            if (!scope.current.fsResp) console.error('Could not find Formstack Response: ' + stateParams.formRespId);
        }

        
        if (state.current.name === 'app.map-form-foreach'
            || state.current.name === 'app.map-form') {
            scope.repeatCount = 0;
            if ($location.hash().length === 0){
                $location.hash("intro");
            }
            scope.hash = $location.hash();

            scope.medias = $vpApi.db.getCollection('media');
            stateParams.formRespId = 'new';
            scope.selectedFeatures = {
                'type:': 'FeatureCollection',
                'features': []
            };
    
        
            scope.current.form = _.find(scope.formstack.forms, function(form){
                return (form.id === parseInt(stateParams.formId, 10));
            });
            scope.current.block = scope.current.form.blocks[0]; // Map forms only have one block.
            
            stateParams.qIndex = stateParams.qIndex || 'intro';
            
            // Set the repeatItem if appropriate.
            scope.current.formRepeatItem;
            if (scope.current.formResp && scope.current.formResp.formRepeatItem) {
                scope.current.formRepeatItem =  scope.current.formResp.formRepeatItem;
            }
            scope.current.formIndex = _.indexOf(scope.formstack.forms, scope.current.form);
            scope.current.blockIndex = _.indexOf(scope.current.form.blocks, scope.current.block);

            // Check for forEach options and populate scope.forEach
            if (scope.current.form.options.forEach && scope.current.form.options.forEach.length > 0) {
                debugger
            } else if (scope.current.form.options.forEachAnswer && scope.current.form.options.forEachAnswer.length > 0) {
                var ans = _getAnswer(scope, scope.current.form.options.forEachAnswer, scope.current.fsRespId);
                var verbose;
                scope.forEach = [];
                _.each(ans.value, function(val){
                    // TODO Look up verbose value from question.choices.
                    //verbose = _.find(question.choices, function(choice){return(choice.value === val);}) || val;
                    scope.forEach.push({'verbose': val, 'value':val});
                });
            } else {
                scope.forEach = [{'verbose':'', 'value':'default'}];
            }

            // Use the first question of the block as the map question. This is where the geoJson is
            // stored for each block.
            scope.mapQuestion = scope.current.block.questions[0];
            _.each(scope.current.block.questions, function(q){
                q.form = {show:false};
            });


        } else {  // Default form case. Sets the form and block resps.
            // Get or create a form response. This should be moved to $formResp.objects.getOrCreate()
            if (stateParams.formRespId.split('-')[0] === 'new') {
                var rs = stateParams.formRespId.split('-');
                if (rs.length === 2){
                    // We are gettting a new formResp from a specific formId
                    var formId = parseInt(rs[1], 10);
                    scope.current.form = _.find(scope.formstack.forms, function(form){
                        return (form.id === formId);
                    });
                    scope.current.formIndex = _.indexOf(scope.formstack.forms, scope.current.form);
                    //scope.formResp = scope.formResps.get(formId);

                } else {
                    // This is redundant, should be removed
                    var formId = null;
                    scope.current.form = scope.formstack.forms[0];
                    scope.current.formIndex = 0;
                }
            } else {
                // We expect to have a formRespId
                if (stateParams.formRespId.length < 1) console.error('No formRespId found in the URL');

                scope.current.formResp = scope.formResps.get(parseInt(stateParams.formRespId, 10));
                scope.current.formIndex = scope.current.formResp.formIndex;
                scope.current.form = scope.formstack.forms[scope.current.formIndex];
            }

            // Get or create a block response. This should be moved to $blockResp.objects.getOrCreate()
            if (stateParams.blockRespId.split('-')[0] === 'new') {
                // This is a new block
                var rs = stateParams.blockRespId.split('-');
                if (rs.length === 2 ){
                    var blockId = parseInt(rs[1],10);
                    scope.current.block = _.find(scope.current.form.blocks, function(block){
                        return (block.id === blockId);
                    });
                    scope.current.blockIndex = _.indexOf(scope.current.form.blocks, scope.current.block);
                } else {
                    // This is redundant, should be removed
                    scope.current.block = scope.current.form.blocks[0];
                    scope.current.blockIndex = 0;
                }
            } else {
                // We expect to have a formRespId
                if (stateParams.blockRespId.length < 1) console.error('No blockRespId found in the URL');

                scope.current.blockResp = scope.blockResps.get(parseInt(stateParams.blockRespId, 10 )) ;
                scope.current.blockIndex = scope.current.blockResp.blockIndex;
                scope.current.block = scope.current.form.blocks[scope.current.blockIndex];
            }

            if (scope.current.block.options.forEachAnswer && scope.current.block.options.forEachAnswer.length > 0) {
                var ans = _getAnswer(scope, scope.current.block.options.forEachAnswer, scope.current.fsRespId);
                var verbose;
                scope.forEach = [];
                _.each(ans.value, function(val){
                    // TODO Look up verbose value from question.choices.
                    //verbose = _.find(question.choices, function(choice){return(choice.value === val);}) || val;
                    scope.forEach.push({'verbose': val, 'value':val});
                });
            }
        }



    };


    _getAnswer = function(scope, qSlug, fsRespId){
        /*
        A shortcut function to make survey authoring a little easier. You can 
        can this from options.skipWhen or options.repeat_count, etc...

        */ 

        fsRespId = fsRespId || scope.current.fsResp.$loki;

        answers = $vpApi.db.getCollection('answer');
        var ans = $vpApi.db.getCollection('answer').chain()
            .find({'questionSlug':qSlug})
            .find({'fsRespId': fsRespId})
            .data();

        if (ans.length > 1){
            console.log("found more than one answer, returns the first one.");
            console.table(ans);
            ans = ans[0];
        } else if (ans.length === 1){
            ans = ans[0];
        } else {
            ans = null;
        }
        console.log('Found answer: ' + ans );
        return ans;
    };


    getEligibleBlock = function(direction, form, currentBlockIndex){
        /*
            Check for repeated block and skipWhen logic. 

            Returns a block or null if no eligilbe block is found on the form.
        */ 
        var out;
        var block;
        var rs;
        var blocks = form.blocks;
        

        function findEligibleBlock(direction){
            console.log("[findEligibleNextBlock] looking for blockIndex " + currentBlockIndex);
            
            if (direction === 'forward') {
                block = blocks[currentBlockIndex + 1];
            }else {
                block = blocks[currentBlockIndex - 1];
            }

            if (block){
                if (typeof(block.options.skipWhen) !== 'undefined'){
                    rs = eval(block.options.skipWhen);

                    console.log('answer ')
                    console.log(getAnswer('marine-activities'))
                    if (rs){
                        console.log('[_getNextBlock()] I need to skip this block and get the next one');

                        if (direction === 'forward'){
                            // Increase index by 1
                            currentBlockIndex++;
                        } else {
                            currentBlockIndex--;
                        }
                        
                        findEligibleBlock(direction);
                        // 
                    } else {
                        console.log('[_getNextBlock()] I can use this block.');
                    }
                } // End if skipWhen
            } else {
                console.log("[_getNextBlock] there are no more blocks on this form" );
            }
            return block;
        };

        block = findEligibleBlock(direction);
        return block
    };



    getEligibleForm = function(direction, currentFormIndex) {
        /*
            Checks for repeated form and skipWhen logic. 
            
            Inputs:
            - direction - [String] 'forward', 'back'
            

            Returns a form or null if no eligilbe form is found on the formstack (i.e. you are done with the survey) 
        */

        var forms = $vpApi.getFormstack().forms;

        function findEligibleForm(direction){
            console.log("[findNextEligibleForm] looking for formIndex " + currentFormIndex);
            if (direction === 'forward'){
                form = forms[currentFormIndex + 1];
            } else {
                form = forms[currentFormIndex - 1];
            }
            if (form){
                if (typeof(form.options.skipWhen) !== 'undefined'){
                    rs = eval(form.options.skipWhen);

                    if (rs){
                        console.log('[_findNextEligibleForm()] I need to skip this form and get the next one');

                        if (direction === 'forward') {
                            // Increase index by 1
                            currentFormIndex++;
                        } else {
                            currentFormIndex--;
                        }
                        
                        findEligibleForm(direction);
                    } else {
                        console.log('[_findNextEligibleForm()] I can use this form.');
                    }
                } // End if skipWhen
            } else {
                console.log("[_getNextBlock] there are no more forms on this form" );
            }
            return form;
        }

        form = findEligibleForm(direction);
        return form;
    };

    loadAnswers = function($scope, fsRespId, formRespId, blockRespId){
        /*

        Get the previous answers to questions and assigns them to q.value for each quesiton 
        in the block. If there are no previous answers the question.value is assign to question.options.default
        or a blank string if no default is present.

        */
        //$scope.previousAnswers = $answers.getByBlockId($scope.current.block.id, $stateParams.blockResponse); // This returns a list of lists of answers.
        console.log("[$formUtils.loadAnswers()]")
        var isNew = false;
        
        formRespId = formRespId + "";
        blockRespId = blockRespId + "";

        if (fsRespId === 'new' 
            || formRespId.split('-')[0] === 'new'
            || blockRespId.split('-')[0] === 'new') isNew = true;


        if (isNew){
            $scope.previousAnswers = [];
        } else {
            $scope.previousAnswers = $scope.answers.chain()
               .find({'fsRespId': parseInt(fsRespId, 10)})
               .find({'formRespId': parseInt(formRespId, 10)})
               .find({'blockRespId': parseInt(blockRespId, 10)})
               .data();
        };

        // Loop over answers and set defaults
        _.each($scope.current.block.questions, function(q){
            // Get the answer for the question
            var ans = _.find($scope.previousAnswers, function(pans){
                return (pans.questionId === q.id);
            });

            console.log("[loadAnswers] Question: " + q.slug )
            if (ans) {
                q.value = ans.value;
                q.previousValue = ans.value;
                q.answerCid = ans.$loki;
            } else if ( typeof(q.options['default']) !==  'undefined'){
                q.value = q.options['default'];
                q.previousValue = q.options['default'];
                q.answerCid = null;
            } else {
                q.value = '';
                q.previousValue = '';
                q.answerCid = null;
            }
        });
    };

    // Watch the url for hash changes.
    parseHash = function(raw){
        /*
        Returns 'intro', 'end', or [formRespId, blockRespId, qIndex]

        */ 
        var out;
        if (raw === 'intro' || raw === 'end') {
            return raw;
        } 

        var pieces = raw.split("/");
        if (pieces.length === 3){
            formRespId = pieces[0];
            blockRespId = pieces[1];
            qIndex = parseInt(pieces[2]);
            out = [formRespId, blockRespId, qIndex]
        } else {
            out = raw;
        }

        return out;
    }

    return {
        setState:setState,
        getAnswer:_getAnswer,
        getEligibleForm: getEligibleForm,
        getEligibleBlock: getEligibleBlock,
        loadAnswers: loadAnswers,
        parseHash: parseHash
    }
}])






