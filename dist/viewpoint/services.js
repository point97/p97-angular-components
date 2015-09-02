// build timestamp: Wed Sep 02 2015 10:39:34 GMT-0700 (PDT)

angular.module('cache.services', [])

.service('$mediacache', ['$vpApi', '$formstack', '$http', '$q', function($vpApi, $formstack, $http, $q){
    var obj = this;
    obj.isCached = false;

    this.run = function(){
        /*
        This should run when the app first loads.

        It uses getFileNames to return  alist of file names to
        request from the server and caches them in a Colleciton named
        'media' with a keywords 'filename' and 'data'

        */
        
        if (!USE_INDEXED_DB || $vpApi.user === undefined) {
            return;
        };
        // This  is the old way of get files.        
        var medias = $vpApi.db.getCollection('media');
        var fnames = obj.getFilenames();
        // Cache all geojsonChoices
        _.each(fnames, function(fname){
            $http({
                method: 'GET',
                // withCredentials: true,
                url: fname
            }).success(function(data) {
                // Save this to persistent storage

                
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


        // This is caches directly from the app media endpoint.
        
        org_id = $vpApi.user.profile.orgs[0].id;
        $vpApi.fetch("pforms/org-media", {org:org_id}, function(data, res){
            
            _.each(data, function(cache){
                if (cache.imageName) {
                    var entry = medias.find({'fname':cache.imageName});
                    
                    if (entry.length > 0){
                        entry.cupdate = $vpApi.getTimestamp();
                        entry.data = "data:image/jpeg;base64," + cache.image64;
                        medias.update(entry);
                    } else {
                        entry = {
                            'fname':cache.imageName,
                            'data': "data:image/jpeg;base64," + cache.image64,
                            'cupdate': $vpApi.getTimestamp()
                        }
                        medias.insert(entry);
                    }
                    $vpApi.db.save();
                }
            })
        }, function(data, res){
            console.log("Failed to fetch org-media")
        })

    };

    this.get = function(fname, appSlug){
        /* 
        Params
        -fname = file name plus extension
        -appSlug

        returns a promise with args (data, status)
        */
        console.log('[mediacache.get]');
        var defer = $q.defer();
        var medias = $vpApi.db.getCollection('media');
        var entry = medias.find({'fname':fname});
        if (entry.length > 0) {
            console.log('[found entry]');
            defer.resolve(entry[0], '');
        } else {
            console.log('[fetching over web]');
            // var url = API_SERVER + "/media/apps/" + appSlug + "/files/" + fname;
            var url = "mock/" + fname;
            $http.get(url).success(function(data, status){
                var entry = {
                    fname: fname,
                    data: data
                }
                defer.resolve(entry, '');
            }).error(function(data, status){
                console.log("[mediacache.get] Could not retrieve media file ");
            });  
        }
        return defer.promise;
    };

    this.getFilenames = function(){

        // Get loop over formstacks and get a list of files names to cache
        var app = $vpApi.getApp();
        var fnames = [];
        if(app && app.formstacks){
            _.each(app.formstacks, function(fs){
                //var fs = $vpApi.getFormstack();
                _.each(fs.forms, function(form){
                    _.each(form.blocks, function(block){
                        _.each(block.questions, function(q){
                            if (q.options.geojsonChoices && q.options.geojsonChoices.path){
                                fnames.push(q.options.geojsonChoices.path);
                            }
                            if (q.options.geoFence && q.options.geoFence.path){
                                fnames.push(q.options.geoFence.path);
                            }
                        }); // End questions loop
                    }); // End block loop
                }); // End forms loop
            })
        }

        console.log("[getFilenames] Files to cache: ");
        console.log(fnames);
        fnames = _.uniq(fnames);
        return fnames;
    }

}])

.service('$tilecache', ['$vpApi', '$formstack', '$timeout', function($vpApi, $formstack, $timeout){
    /*
    Handles tiles caching.
    */
    var obj = this;
    var cachedArray = [];
    this.regions = [];
    this.cacheTimer = {'start':null, 'stop':null, 'elasped':null};


    this.isCached = function(tileSourceCount){

        var rs = parseInt(localStorage.getItem('tilesCount'));
        return (rs === tileSourceCount);
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

    this.getRegions = function(fs){
        /*
        Look for forms with Regions.
        Returns the list of regions or an empty list.
        */
        var out = [];
        
        _.each(fs.forms, function(form){
            if (form.type === 'map-form' && form.options.regions) {
                out = _.uniq( out.concat(form.options.regions) );
            }
        });
        obj.regions = out;
        return out;
    }

    this.getTileSources = function(fs){
        /*
        Look for the first map-form with tile sources
        and returns those sources in an array of objects

        This means caching will be derived ONLY from the first set of tile sources

        In the future the tile sources should be defined at the formstack level
        */

        obj.tileSources = [];

        var form = _.find(fs.forms, function(formItem){
            return (formItem.type === 'map-form' && formItem.options.tileSources)
        });
        if (form) {
            obj.tileSources = form.options.tileSources;
        }
        
        return obj.tileSources;
    }

    this.loadRegions = function(layer, onSuccess, onError){
        if (obj.regions.length === 0) {
            obj.getRegions();
            if (obj.regions.length === 0);
            return
        }
        var maxZoom = obj.getMaxCacheZoom();
        var nbTiles = layer.calculateNbTiles(maxZoom, obj.regions);

        console.log("Will be saving: " + nbTiles + " tiles")
        layer.saveRegions(obj.regions, maxZoom, 
          function(){
            console.log('[saveRegions] onStarted');
          },
          function(){
            console.log('[saveRegions] onSuccess');
            obj.cacheTimer.stop = new Date();
            obj.cacheTimer.elasped = obj.cacheTimer.stop - obj.cacheTimer.start;
            console.log("Cache timer elapsed time (min): " + obj.cacheTimer.elasped/1000/60)
            var count = parseInt(localStorage.getItem('tilesCount')) || 0;
            localStorage.setItem('tilesCount', count+1);
            onSuccess();
          },
          function(error){
            console.log('onError');
            console.log(error);
            onError();
          })

    } // end loadRegions.

    this.run = function(success, error){
        obj.offlineLayers = [];
        obj.cacheTimer.start = new Date();
        // These need to be passed in from form.options
        // var mapquestUrl = 'http://{s}.mqcdn.com/tiles/1.0.0/osm/{z}/{x}/{y}.png'
        // var subDomains = ['otile1','otile2','otile3','otile4']
        // var mapquestAttrib = 'Data, imagery and map information provided by <a href="http://open.mapquest.co.uk" target="_blank">MapQuest</a>, <a href="http://www.openstreetmap.org/" target="_blank">OpenStreetMap</a> and contributors.'

        var app = $vpApi.getApp();
        var tilesSources = [];

        _.each(app.formstacks, function(fs) {
            tileSources = obj.getTileSources(fs);
        });


        onError = function(errorType, errorData1, errorData2){
            /*
                Fires when $tilecache errors out during tile caching.
            */
            console.log("[$tilecache.run.onError()] ");
            localStorage.setItem('tilesCount', 0);
            console.log(errorType)
            console.log(errorData1)
            console.log(errorData2)
            error();
        }

        // Initalize a map
        var map = L.map('cache-map').setView([-2.9, -79], 13);

        _.each(tileSources, function(tileSource) {
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
            var layer = new OfflineLayer(tileSource.url, options);
            obj.offlineLayers.push(layer);
            $timeout(function(){
                obj.loadRegions(layer, success, error);
            }, 1000);
        })
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

    this.clearTilesDb = function(callback){
        /*
        Use this to clear the tiles database from indexedDB
        */

        var app = $vpApi.getApp();
        var tilesSources = [];

        _.each(app.formstacks, function(fs) {
            tilesSources = obj.getTileSources(fs);
        });



        osTableNames = [];

        _.each(tilesSources, function(tileSource, i) {

            osTableNames.push(tileSource.storeName);
            dbName = "IDBWrapper-" + osTableNames[i];

            var openRequest = window.indexedDB.open(dbName, 1); //version used
            openRequest.onerror = function (e) {
                console.log("[openTilesDb] Database error: " + e.target.errorCode);
            };
            openRequest.onsuccess = function (event) {

                window.db = openRequest.result;

                console.log("[openTilesDb] Opened "+window.db.name+" with dataStores");
                console.log(window.db.objectStoreNames);
                var tableName = window.db.name.split('-')[1];
                var store = window.db.transaction(tableName, "readwrite").objectStore(tableName);

                store.clear().onsuccess = function (event) {
                    localStorage.removeItem("tilesCount");
                    console.log('Finished clearing ' + tableName);
                };
            };
        })

        callback(event);
    };
}])
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
  };

  obj.save = function(tableName, data){
      var deferred = $q.defer();
      var org = $vpApi.user.profile.orgs[0].id;
      data[org] = org;

      // Set method and resource depding on if it's new or not.
      var method = 'post';
      var resource = "dock/"+tableName;
      if (data.id !== undefined){
        method = 'patch';
        resource += "/"+ data.id;
      }

      $vpApi[method](resource, data, function(data, status){
          deferred.resolve(data, status);
      }, function(data, status){
          console.log("[choiceList.save] failed", data);
          deferred.reject(data, status);
      });
      return deferred.promise;
  };

}])

.service('$qaRecord',['$vpApi', '$q', function($vpApi, $q){
    var obj = this;
    var resource = 'dock/qa-record'
    obj.fetch = function(){
      var deferred = $q.defer();
      var orgSlug = $vpApi.user.profile.orgs[0].slug;

      var params = {
          orgSlug: orgSlug,
      };
      $vpApi.fetch(resource, params, function(data, status){
          deferred.resolve(data, status);
      }, function(data, status){
          console.log("[choiceList.fetch] failed", data);
          deferred.reject(data, status);
      });
      return deferred.promise;
    };

    obj.fetchById = function(qaId){
      var deferred = $q.defer();
      var orgSlug = $vpApi.user.profile.orgs[0].slug;

      var params = {
          orgSlug: orgSlug,
          full:true
      };
      $vpApi.fetch(resource+"/"+qaId, params, function(data, status){
          deferred.resolve(data, status);
      }, function(data, status){
          console.log("[$qaRecord.fetchById] failed", data);
          deferred.reject(data, status);
      });
      return deferred.promise;
    };
}])



.service('$combinedSample',['$vpApi', '$q', function($vpApi, $q){
    var obj = this;
    var resource = 'dock/combined-sample';

    obj.fetchByQaRecordId = function(qaId){
      var deferred = $q.defer();
      var orgSlug = $vpApi.user.profile.orgs[0].slug;

      var params = {
        'qarecordId': qaId
      }
      $vpApi.fetch(resource, params, function(data, status){
          if (data.length > 0) {
            data = data[0];
          } else {
            data = null;
          }
          deferred.resolve(data, status);
      }, function(data, status){
          console.log("[$combinedSample.fetchById] failed", data);
          deferred.reject(data, status);
      });
      return deferred.promise;
    };
}])



.service('$sample',['$vpApi', '$q', function($vpApi, $q){
    var obj = this;
    var resource = 'dock/qa-record'
    obj.fetch = function(){
      var deferred = $q.defer();
      var orgSlug = $vpApi.user.profile.orgs[0].slug;

      var params = {
          orgSlug: orgSlug,
      };
      $vpApi.fetch(resource, params, function(data, status){
          deferred.resolve(data, status);
      }, function(data, status){
          console.log("[choiceList.fetch] failed", data);
          deferred.reject(data, status);
      });
      return deferred.promise;
    };

    obj.fetchById = function(qaId){
      var deferred = $q.defer();
      var orgSlug = $vpApi.user.profile.orgs[0].slug;

      var params = {
          orgSlug: orgSlug,
          full:true
      };
      $vpApi.fetch(resource+"/"+qaId, params, function(data, status){
          deferred.resolve(data, status);
      }, function(data, status){
          console.log("[$qaRecord.fetchById] failed", data);
          deferred.reject(data, status);
      });
      return deferred.promise;
    };
}])

.service('$dockUser',['$vpApi', '$q', function($vpApi, $q){
    var obj = this;

    this.save = function(data){
        /*
        Updates a user's profile. 
        */

        var defer = $q.defer();
        var method;
        var resource = 'dock/user';
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




angular.module('mock-ionic.services', [])

.service( '$ionicLoading', [ "blockUI", "$timeout", function(blockUI, $timeout) {
    console.log("mock $ionicLoading ");

    obj = this;

    var myBlockUI = blockUI.instances.get('myBlockUI'); 

    this.show = function(func){
        if (platform === "web"){
            myBlockUI.reset();
           myBlockUI.start();
        }    
    }

    this.hide = function(){
        if (platform === "web"){
            $timeout(function(){
                myBlockUI.stop();
            }, 2000);
        }
        
    }
}])




.service('$loadingModal', [ '$modal', function($modal){
    /*
        This is the angular strap loading modal.
    */
    var obj = this;

    obj.$modal = $modal({
        template: 'views/partials/loading-modal.html',
        container: "body",
        backdrop: "static",
        placement: 'center',
        keyboard: false,
        show: false
    });

    obj.show = function(){
        obj.$modal.$promise.then(function() {
            obj.$modal.show();
        });
    }

    obj.hide = function(){
        obj.$modal.hide();
    }
}])


.service( '$ionicModal', ["$q", function($q) {
    console.log("mock $ionicModal");


    this.fromTemplateUrl = function(){
        return $q(function(resolve, reject){
            resolve("Fake resolve");
        })
    };
}])

.service( '$ionicPopup', ["$q", function($q) {
    console.log("mock $ionicPopup")

    this.confirm = function(){
        return $q(function(resolve, reject){
            resolve("Fake resolve");
        })
    }
}])

.service( '$ionicScrollDelegate', [function() {
    console.log("mock $ionicScrollDelegate");
}]);

angular.module('ionic-timepicker', [], function(){
    // I'm just here for looks.
})

angular.module('survey.services', [])

.factory('$formUtils', ['$vpApi', '$location','$formstack', '$formResp', function($vpApi, $location, $formstack, $formResp) {
    var obj = this;

    var VERBOSE = false;
    setState = function(scope, state, stateParams){
        /*
        Sets scope.current with appropriate variables based on the URL and the hash.

        */

        scope.current = {
            fsResp: null,

            form: null,
            formIndex: null,
            formResp: null,

            block: null,
            blockIndex: null,
            blockResp: null,

            qIndex: null,
            hash: null

        };
        scope.current.formRepeatItem;
        var fsSlug = null;
        if(stateParams && stateParams.fsSlug){
            fsSlug = stateParams.fsSlug;
        }
        // Getting loki Collection for queries
        scope.formstack = $vpApi.getFormstack(fsSlug);
        scope.fsResps = $vpApi.db.getCollection('fsResp');
        scope.formResps = $vpApi.db.getCollection('formResp');
        scope.blockResps = $vpApi.db.getCollection('blockResp');
        scope.answers = $vpApi.db.getCollection('answer');
        scope.medias = $vpApi.db.getCollection('media');


        if (stateParams.fsRespId === 'new') {
            // Set the current form and block
            scope.current.form = angular.copy(scope.formstack.forms[0]);
            scope.current.formIndex = 0;

            scope.current.block = angular.copy(scope.formstack.forms[0].blocks[0]);
            scope.current.blockIndex = 0;
        } else {
            // Set current fsResp
            scope.current.fsResp = scope.fsResps.find({id:stateParams.fsRespId})[0];
            if (!scope.current.fsResp) console.error('Could not find Formstack Response: ' + stateParams.formRespId);
        }


        if (state.current.name === 'app.map-form-foreach' || state.current.name === 'app.map-form') {
            /*
            Sets
            scope.current.form
            scope.current.formIndex

            scope.current.block
            scope.current.blockIndex

            scope.current.hash
            scope.selectedFeatures
            stateParams.qIndex  // NOT SURE WE NEED THIS
            scope.mapQuestion

            scope.current.formRepeatItem
            scope.repeatCount

            And sets
            questions.form.show to false

            */

            scope.repeatCount = 0;
            // if ($location.hash().length === 0){
            //     $location.hash("intro");
            // }
            $location.hash('intro'); // Also go to intropage on load.
            scope.current.hash = $location.hash();

            stateParams.formRespId = 'new';
            scope.selectedFeatures = {
                'type:': 'FeatureCollection',
                'features': []
            };

            scope.current.form = _.find(scope.formstack.forms, function(form){
                return (form.id === parseInt(stateParams.formId, 10));
            });
            scope.current.block = scope.current.form.blocks[0]; // Map forms only have one block.
            scope.mapQuestion = scope.current.block.questions[0];
            scope.mapQuestion.value = ""; // Clear the value of th map question.
            _.each(scope.current.block.questions, function(q){
                q.form = {show:false};
            });

            stateParams.qIndex = stateParams.qIndex || 'intro';

            // Set the repeatItem if appropriate.
            if (scope.current.formResp && scope.current.formResp.formForEachItem) {
                scope.current.formRepeatItem =  scope.current.formResp.formForEachItem;
            }
            scope.current.formIndex = _.indexOf(scope.formstack.forms, scope.current.form);
            scope.current.blockIndex = _.indexOf(scope.current.form.blocks, scope.current.block);

            // Check for forEach options and populate scope.forEach
            if (scope.current.form.options.forEach && scope.current.form.options.forEach.length > 0) {
                debugger;
            
            
            } else if (scope.current.form.options.forEachAnswer && scope.current.form.options.forEachAnswer.length > 0) {
                /************** FOR EACH AND FOR EACH ANSWER STUFF *******************/
                var ans = _getAnswer(scope, scope.current.form.options.forEachAnswer, scope.current.fsRespId);
                var verbose;
                scope.forEach = [];
                _.each(ans.value, function(val){
                    // TODO Look up verbose value from question.choices.
                    //verbose = _.find(question.choices, function(choice){return(choice.value === val);}) || val;
                    scope.forEach.push({'verbose': val, 'value':val});
                });
            

            } else if (scope.current.form.blocks[0].options.repeatable) {
                /************** REPEATABLE BLOCK STUFF *******************/
                // get or create formResp
                var formResps = scope.formResps.chain()
                    .find({'fsRespId': scope.current.fsResp.id}) // There should only be one form response for a given item.
                    .find({'formId': scope.current.form.id})
                    .data();

                // A get or create on formResp and set item.formResp 
                if (formResps.length === 0) {
                    scope.current.formResp = scope.formResps.insert({
                        'fsSlug':scope.formstack.slug,
                        'fsRespId': scope.current.fsResp.id,
                        'formId': scope.current.form.id,
                        'formIndex': scope.current.formIndex,
                        'formForEachItem':null,
                        'client_created': $vpApi.getTimestamp(),
                        'client_updated': $vpApi.getTimestamp()
                    });
                    $vpApi.db.save()
                } else {
                    scope.current.formResp = formResps[0];
                }

                scope.current.form.blockResps = scope.blockResps.chain()
                    .find({'fsRespId': scope.current.fsResp.id})
                    .find({'formId': scope.current.form.id})
                    .data();
            } else {
                //****************** DEFAULT FORM STUFF *************************/
                // get or create formResp
                var formResps = scope.formResps.chain()
                    .find({'fsRespId': scope.current.fsResp.id}) // There should only be one form response for a given item.
                    .find({'formId': scope.current.form.id})
                    .data();

                // A get or create on formResp and set item.formResp 
                if (formResps.length === 0) {
                    scope.current.formResp = scope.formResps.insert({
                        'fsSlug':scope.formstack.slug,
                        'fsRespId': scope.current.fsResp.id,
                        'formId': scope.current.form.id,
                        'formIndex': scope.current.formIndex,
                        'formForEachItem':null,
                        'client_updated': $vpApi.getTimestamp()
                    });
                    $vpApi.db.save()
                } else {
                    scope.current.formResp = formResps[0];
                }

                // Look for block Resp
                var blockResps = scope.blockResps.chain()
                    .find({'fsRespId': scope.current.fsResp.id}) // There should only be one form response for a given item.
                    .find({'formRespId': scope.current.formResp.id})
                    .find({'blockId': scope.current.block.id})
                    .data();

                if (blockResps.length > 0){
                    scope.current.blockResp = blockResps[0];
                }
                
            }



        } else if (state.current.name === 'app.form-foreach') {
           /*
            forEach form case.
            Sets:
            scope.current.form
            scope.current.formIndex

            scope.current.page
            */

            scope.current.form = _.find(scope.formstack.forms, function(form){
                return (form.id === stateParams.formId);
            });
            scope.current.formIndex = _.indexOf(scope.formstack.forms, scope.current.form);
            scope.current.page = stateParams.page;
            scope.current.form.forEach = null;

        } else {
            /*
            Default form case.
            Sets

            scope.current.form
            scope.current.formResp
            scope.current.formIndex

            scope.current.block
            scope.current.blockResp
            scope.current.blockIndex

            Also sets

            scope.current.form.formForEachItem

            */

            //Get or create a form response. This should be moved to $formResp.objects.getOrCreate()
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

                scope.current.formResp = scope.formResps.find({id:stateParams.formRespId})[0];
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

                scope.current.blockResp = scope.blockResps.find({id:stateParams.blockRespId})[0] ;
                scope.current.blockIndex = scope.current.blockResp.blockIndex;
                scope.current.block = scope.current.form.blocks[scope.current.blockIndex];
            }

        } // End default case


        /*
        Set form forEach variables:
        scope.current.form.forEach
        scope.current.form.formForEachItem

        scope.current.block.forEach
        scope.current.block.formForEachItem

        */

        if (scope.current.form.options.forEach && scope.current.form.options.forEach.length > 0) {
            // TODO This is not yet implemented
            debugger;
        
        } else if (scope.current.form.options.forEachAnswer && scope.current.form.options.forEachAnswer.length > 0) {
            var ans = _getAnswer(scope, scope.current.form.options.forEachAnswer, scope.current.fsRespId);
            var verbose, question, choice;
            scope.current.form.forEach = [];
            _.each(ans.value, function(val){
                choice = $formstack.getChoice(scope.current.form.options.forEachAnswer, val);
                scope.current.form.forEach.push(choice);
            });
        }
        if (scope.current.form.forEach){
            // This will populate the formForEachItems with formResp and blockResp.
            // It also keeps the formResp in sync with the answers selected
            loadFormForEachItems(scope);
        }

        if (scope.current.block){
            // Set block forEach variable
            if (scope.current.block.options.forEach && scope.current.block.options.forEach.length > 0) {
                // TODO This is not yet implemented
                debugger
            } else if (scope.current.block.options.forEachAnswer && scope.current.block.options.forEachAnswer.length > 0) {
                var ans = _getAnswer(scope, scope.current.block.options.forEachAnswer, scope.current.fsRespId);
                var verbose;
                scope.current.block.forEach = [];
                _.each(ans.value, function(val){
                    // TODO Look up verbose value from question.choices.
                    //verbose = _.find(question.choices, function(choice){return(choice.value === val);}) || val;
                    scope.current.block.forEach.push({'verbose': val, 'value':val});
                });
            }
        }

        // Set the forEachItem
        var formForEachItem = null;
        if (scope.current.formResp && scope.current.formResp.formForEachItem !== undefined){
            var formForEachItem = scope.current.formResp.formForEachItem;
            if (formForEachItem === null || formForEachItem === '') {
                formForEachItem = null;
            }
        }
        if (formForEachItem !== null){
            choice = $formstack.getChoice(scope.current.formResp.formForEachQuestionSlug, scope.current.formResp.formForEachItem);
            scope.current.form.formForEachItem = choice;
        }

        

    }; // End setState()


    changeState = function($scope, $state, action){
        /*
        Changes $state based on the aciton.

        Inputs:
        action: [String] 'forward', 'back'
        */
        var newState = 'app.';
        var newStateParams;
        var nextBlock, nextForm;
        var prevFormResp;
        var prevBlockResp
        var newHash = null;
        var fsSlug = null;

        var blocks = $scope.current.form.blocks; // This will go away completely, just need to defined _getPrevEligibleBlock().

        if($state && $state.params && $state.params.fsSlug){
            fsSlug = $state.params.fsSlug;
        }

        getAnswer = function(qSlug){
            /*
            A shortcut function to make survey authoring a little easier. You can
            can this from options.skipWhen or options.repeat_count, etc...

            */

            fsRespId = $scope.current.fsResp.id;
            answers = $vpApi.db.getCollection('answer');
            var ans = $vpApi.db.getCollection('answer').chain()
                .find({'questionSlug':qSlug})
                .find({'fsRespId': fsRespId})
                .data();

            if (ans.length > 1){
                console.warn("[getAnswer()] found more than one answer, returns the first one.");
                console.table(ans);
                ans = ans[0];
            } else if (ans.length === 1){
                ans = ans[0];
            } else {
                ans = null;
                console.error("[]getAnswer] No answer found");
            }
            if (VERBOSE) console.log('Found answer: ' + ans );
            return ans;
        };

        if (action === 'forward' || action === 'repeat-block' || action === 'repeat-form') {

            if (action === 'forward') {
                if ($scope.current.page === 'end' || $scope.current.page === 'intro'){
                    nextBlock = null;
                } else {
                    // See if there is another eligable block
                    nextBlock = this.getEligibleBlock(action, $scope.current.form, $scope.current.blockIndex);
                }

            } else if (action === 'repeat-block' || action === 'repeat-form') {
                nextBlock = $scope.current.block;
            }

            if (nextBlock) {
                if (VERBOSE) console.log('[LinearBlockCtrl.saveBlock()] found next block, setting state');

                // Get the an already existing blockResp or make a new one
                var blockRespId, page;
                if (action === 'forward') {
                    formRespId = $scope.current.formResp.id;
                    var blockResps = $scope.blockResps
                        .chain()
                        .find({'blockId':nextBlock.id})
                        .find({'formRespId':$scope.current.formResp.id})
                        .data();

                    if (blockResps.length > 0) {
                        blockRespId = blockResps.slice(-1)[0].id; // Grab the last one.
                    } else {
                        blockRespId = 'new-' + nextBlock.id
                    }

                } else if (action === 'repeat-form') {

                    if ($scope.current.form.type === 'map-form'){
                        $location.hash('intro');
                        return
                    } else {
                        // TODO Add non map for repeat action
                        debugger
                        // $scope.current.formRepeatItem = null;
                        formRespId = 'new-' + $scope.current.form.id;
                        blockRespId = 'new-' + nextBlock.id;
                    }
                } else if (action === 'repeat-block') {
                    if ($scope.current.form.type === 'map-form'){
                        // Just change the hash, not the URL.
                        var blockRespId = "new-" + $scope.current.block.id; // This is the server Id.
                        $location.hash([$scope.current.formResp.id, blockRespId, 0].join("/"));
                        return;
                    } else {
                        formRespId = $scope.current.formResp.
                        blockRespId = 'new-' + nextBlock.id;
                        newHash = '0'  // TODO Make this a conditional based on if newForm is a map-form.
                    }

                }

                newState += ($scope.current.form.type) ? $scope.current.form.type : 'form';
                if($scope.current.form.forEach){
                    // If it is the last block in the forEach form send to end page.
                    if (_.indexOf($scope.current.form.blocks, nextBlock) === $scope.current.form.blocks.length - 1){
                        newState += "-foreach";
                        page = 'end';
                    }
                }
                newStateParams = {
                    'fsSlug': $scope.formstack.slug,
                    'fsRespId': $scope.current.fsResp.id,
                    'formRespId': formRespId,
                    'formId': $scope.current.form.id,
                    'blockRespId': blockRespId,
                    'hash': newHash,
                    'page': page,
                    'qIndex': newHash
                }
                $state.go(newState, newStateParams);
                return;

            } else {
                if (VERBOSE) console.log('[LinearBlockCtrl.saveBlock()] No more blocks in this form, so grabbing the first block of the next form');
                //nextForm = $scope.formstack.forms[$scope.current.formIndex + 1];
                var nextFormRespId, nextBlock, nextBlockRespId;
                var nextForm = this.getEligibleForm(action, $scope.current.formIndex, fsSlug);
                if (nextForm){
                    newState += (nextForm.type) ? nextForm.type : 'form';
                    
                    // Send them to the first formResp created if found.
                    formResps = $scope.formResps.chain()
                        .find({'fsRespId':$scope.current.fsResp.id})
                        .find({'formId': nextForm.id})
                        .simplesort('created')
                        .data();

                    if (formResps.length > 0){
                        nextFormRespId = formResps[0].id;

                    } else {
                        nextFormRespId = 'new-' + nextForm.id;
                    }

                    nextBlock = getEligibleBlock('forward', nextForm, -1);
                    
                    if(nextBlock.forEach){
                        // TODO
                        console.error("Not implemented")
                        debugger;
                    } else {
                        // Send them to the first blockResp created if found.
                        blockResps = $scope.blockResps.chain()
                            .find({'fsRespId':$scope.current.fsResp.id})
                            .find({'formRespId': nextFormRespId})
                            .find({'blockId': nextBlock.id})
                            .simplesort('$loki',false)
                            .data();

                        if (blockResps.length > 0){
                            nextBlockRespId = blockResps[0].id;
                        } else {
                            nextBlockRespId = 'new-' + nextBlock.id;
                        }
                    }

                    
                    if(nextForm.options.forEach || nextForm.options.forEachAnswer){
                        newState += "-foreach";
                        newHash = 'intro'; // This is used be the map-form

                    }
                    newStateParams = {
                        'fsSlug': $scope.formstack.slug,
                        'fsRespId': $scope.current.fsResp.id,
                        'formId': nextForm.id,
                        'formRespId': nextFormRespId,
                        'blockRespId': nextBlockRespId,
                        'hash': newHash, // This is used by map-form-foreach
                        'page': newHash, // This is used by form-foreach
                        'qIndex': 'intro'
                    }
                    $state.go(newState, newStateParams);
                    return;

                } else {
                    if (VERBOSE) console.log('[LinearBlockCtrl.saveBlock()] No more forms. You are done.');
                    // Update the fsResp

                    $scope.current.fsResp.status = 'complete';
                    $scope.current.fsResp.client_updated = $vpApi.getTimestamp();
                    $vpApi.db.save();

                    if (VERBOSE) console.log('[LinearBlockCtrl.saveBlock()] No more forms. You are done.');
                    $state.go('app.complete', {'fsRespId':$scope.current.fsResp.id});  // Use $state.go here instead of $location.path or $location.url
                    return;
                }
            }

        } else if (action === 'back'){
            // See if there is a previous block
            prevBlock = this.getEligibleBlock(action, $scope.current.form, $scope.current.blockIndex);

            if (prevBlock){

                if (VERBOSE) console.log('[LinearBlockCtrl.saveBlock()] found next block');

                // Get the last blockResp
                //var prevBlockResps = $scope.blockResps.find({blockId:prevBlock.id})
                var prevBlockResps = $scope.blockResps.chain()
                    .find({blockId:prevBlock.id})
                    .find({formRespId:$scope.current.formResp.id})
                    .data();

                if (prevBlockResps.length > 0){
                    prevBlockResp = prevBlockResps.slice(-1)[0];
                } else {
                    prevBlockResp = {'id':'new-'+prevBlock.id};
                }

                newState += ($scope.current.form.type) ? $scope.current.form.type : 'form';
                newStateParams = {
                    'fsSlug': $scope.formstack.slug,
                    'fsRespId': $scope.current.fsResp.id,
                    'formRespId': $scope.current.formResp.id,
                    'blockRespId': prevBlockResp.id,
                    'hash': newHash
                }
            } else {
                if (VERBOSE) console.log('[LinearBlockCtrl.saveBlock()] This is the first block in the form');
                //prevForm = $scope.formstack.forms[$scope.current.formIndex - 1];

                prevForm = this.getEligibleForm(action, $scope.current.formIndex, fsSlug);
                if (prevForm){
                    if (VERBOSE) console.log('[LinearBlockCtrl.saveBlock()] Found prev form');

                    // Get the last form response
                    var prevFormResp = $scope.formResps
                        .chain()
                        .find({fsRespId: $scope.current.fsResp.id})
                        .find({formId:prevForm.id})
                        .data();

                    if (prevFormResp.length > 1) {
                        prevFormResp = prevFormResp.slice(-1)[0];
                    } else if (prevFormResp.length === 1){
                        prevFormResp = prevFormResp[0];
                    } else {
                        prevFormResp = {'id':'new-'+prevForm.id};
                    }

                    // Get the last blockResp from the last eligible block of the previous form
                    var prevBlock = this.getEligibleBlock(action, prevForm, prevForm.blocks.length);

                    var prevBlockResp = $scope.blockResps
                        .chain()
                        .find({blockId:prevBlock.id})
                        .find({formRespId:prevFormResp.id})
                        .data();

                    if (prevBlockResp.length > 1) {
                        prevBlockResp = prevBlockResp.slice(-1)[0];
                    } else if (prevBlockResp.length === 1){
                        prevBlockResp = prevBlockResp[0];
                    } else {
                        prevBlockResp = {'id':'new-'+prevBlock.id};
                    }

                    newState += (prevForm.type) ? prevForm.type : 'form';
                    if(prevForm.options.forEach || prevForm.options.forEachAnswer){
                        newState += "-foreach";
                        page = 'intro'; // This is used be the map-form
                    }
                    newStateParams = {
                        'fsSlug': $scope.formstack.slug,
                        'fsRespId': $scope.current.fsResp.id,
                        'formRespId': prevFormResp.id,
                        'formId': prevForm.id, // This is needed for map-form and map-form-foreach
                        'blockRespId': prevBlockResp.id,
                        'hash': page,
                        'page': page
                    }

                } else {
                    if (VERBOSE) console.log('[LinearBlockCtrl.saveBlock()] No more forms. You are done.');
                    $state.go('app.home');  // Use $state.go here instead of $location.path or $location.url
                    return;
                }
            }
        };
        $scope.newStateParams = newStateParams; //This is here for testing.
        $state.go(newState, newStateParams);
    }; // End changeState();

    _getAnswer = function(scope, qSlug, fsRespId, blockRespId){
        /*
        A shortcut function to make survey authoring a little easier. You can
        can this from options.skipWhen or options.repeat_count, etc...

        */

        fsRespId = fsRespId || scope.current.fsResp.id;

        answers = $vpApi.db.getCollection('answer');
        var qs = $vpApi.db.getCollection('answer').chain()
            .find({'questionSlug':qSlug})
            .find({'fsRespId': fsRespId});
        if (blockRespId) {
            qs = qs.find({'blockRespId': blockRespId})
        }
        var ans = qs.data();

        if (ans.length > 1){
            if (VERBOSE) console.log("found more than one answer, returns the first one.");
            console.table(ans);
            ans = ans[0];
        } else if (ans.length === 1){
            ans = ans[0];
        } else {
            ans = null;
        }
        if (VERBOSE) console.log('Found answer: ' + ans );
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
            if (VERBOSE) console.log("[findEligibleNextBlock] looking for blockIndex " + currentBlockIndex);

            if (direction === 'forward') {
                block = blocks[currentBlockIndex + 1];
            }else {
                block = blocks[currentBlockIndex - 1];
            }

            if (block){
                if (typeof(block.options.skipWhen) !== 'undefined'){
                    rs = eval(block.options.skipWhen);

                    if (rs){
                        if (VERBOSE) console.log('[_getNextBlock()] I need to skip this block and get the next one');

                        if (direction === 'forward'){
                            // Increase index by 1
                            currentBlockIndex++;
                        } else {
                            currentBlockIndex--;
                        }

                        findEligibleBlock(direction);
                        //
                    } else {
                        if (VERBOSE) console.log('[_getNextBlock()] I can use this block.');
                    }
                } // End if skipWhen
            } else {
                if (VERBOSE) console.log("[_getNextBlock] there are no more blocks on this form" );
            }
            return block;
        }

        block = findEligibleBlock(direction);
        return block;
    };

    // If we have forEach items, attach previous formResp and blockResp
    loadFormForEachItems = function(scope){
        var staleFormResps;

        _.each(scope.current.form.forEach, function(item){
            item.formResp = scope.formResps.chain()
                .find({'fsRespId': scope.current.fsResp.id}) // There should only be one form response for a given item.
                .find({'formId': scope.current.form.id})
                .find({'formForEachItem': item.value})
                .data();

            // A get or create on formResp and set item.formResp
            if (item.formResp.length === 0) {
                if (VERBOSE) console.log("Create a formResp for " + item);
                item.formResp = scope.formResps.insert({
                    'fsSlug':scope.formstack.slug,
                    'fsRespId': scope.current.fsResp.id,
                    'formId': scope.current.form.id,
                    'formIndex': scope.current.formIndex,
                    'formForEachItem':item.value,
                    'formForEachQuestionSlug': scope.current.form.options.forEachAnswer,
                    'client_created': $vpApi.getTimestamp(),
                    'client_updated': $vpApi.getTimestamp()
                });
                $vpApi.db.save()
            } else {
                item.formResp = item.formResp[0];
            }

            // Get the block responses.
            item.blockResps = scope.blockResps.chain()
                .find({'fsRespId': scope.current.fsResp.id}) // There should only be one form response for a given item.
                .find({'formRespId': item.formResp.id})
                .simplesort('created')
                //.find({'formForEachItem': item.value})
                //.simplesort('created', false)
                .data()
            if (item.blockResps.length > 0) {
                item.formRespId = item.blockResps[0].formRespId;
                item.blockRespId = item.blockResps[0].id;
                item.isNew = false;
            } else {
                item.formRespId = "new-" + scope.current.form.id;
                item.blockRespId = "new-" + scope.current.form.blocks[0].id;
                item.isNew = true;
            }

            item.form = "form"
        });

        // Removes formResps and children that do not have an item in
        // in current.form.forEach
        var res = scope.formResps.chain()
            .find({'formId': scope.current.form.id})
            .find({'fsRespId': scope.current.fsResp.id})

        // Exclude resps that have forEach items on the forRach array.
        _.each(scope.current.form.forEach, function(item){
            res.find({'formForEachItem': {'$ne': item.value }});
        });

        staleFormResps = res.data();
        if (VERBOSE) console.log("Stale Form Resps");
        console.table(staleFormResps);
        _.each(staleFormResps, function(resp){
            $formResp.delete(resp.id);
        });

    };

    getEligibleForm = function(direction, currentFormIndex, fsSlug) {
        /*
            Checks for repeated form and skipWhen logic.

            Inputs:
            - direction - [String] 'forward', 'back'
            - currentFormIndex - Int
            - fsSlug - the slug of the current formstack (can be null)

            Returns a form or null if no eligilbe form is found on the formstack (i.e. you are done with the survey)
        */

        var forms = $vpApi.getFormstack(fsSlug).forms;

        function findEligibleForm(direction){
            if (VERBOSE) console.log("[findNextEligibleForm] looking for formIndex " + currentFormIndex);
            if (direction === 'forward'){
                form = forms[currentFormIndex + 1];
            } else {
                form = forms[currentFormIndex - 1];
            }
            if (form){
                if (typeof(form.options.skipWhen) !== 'undefined'){
                    rs = eval(form.options.skipWhen);

                    if (rs){
                        if (VERBOSE) console.log('[_findNextEligibleForm()] I need to skip this form and get the next one');

                        if (direction === 'forward') {
                            // Increase index by 1
                            currentFormIndex++;
                        } else {
                            currentFormIndex--;
                        }

                        findEligibleForm(direction);
                    } else {
                        if (VERBOSE) console.log('[_findNextEligibleForm()] I can use this form.');
                    }
                } // End if skipWhen
            } else {
                if (VERBOSE) console.log("[_getNextBlock] there are no more forms on this form" );
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
               .find({'fsRespId': fsRespId})
               .find({'formRespId': formRespId})
               .find({'blockRespId': blockRespId})
               .data();
        };

        // Loop over answers and set defaults
        _.each($scope.current.block.questions, function(q){
            // Get the answer for the question
            var ans = _.find($scope.previousAnswers, function(pans){
                return (pans.questionId === q.id);
            });


            if (ans) {
                q.value = ans.value;
                q.previousValue = ans.value;
                q.answerId = ans.id;
            } else if ( typeof(q.options['default']) !==  'undefined'){
                q.value = q.options['default'];
                q.previousValue = q.options['default'];
                q.answerId = null;
            } else {
                q.value = '';
                q.previousValue = '';
                q.answerId = null;
            }
        });
    };

    // Watch the url for hash changes.
    parseHash = function(raw){
        /*
        Returns 'intro', 'end', or [formRespId, blockRespId, qIndex]
        
        qIndex will always be an integer, formRespId and blockRespId are strings.
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
    };

    return {
        setState:setState,
        changeState:changeState,
        getAnswer:_getAnswer,
        getEligibleForm: getEligibleForm,
        getEligibleBlock: getEligibleBlock,
        loadAnswers: loadAnswers,
        parseHash: parseHash
    };
}])

'user strict';

angular.module('vpApi.services', [])

.service( '$vpApi', ['$rootScope', '$http', '$q', 'config', function($rootScope, $http, $q, config) {
    var obj = this;
    var apiBase = config.apiBaseUri;
    this.username = '';
    this.user = {};
    this.users;
    this.dbLoaded = false;

    this.dbinit = function(initCallback){
        /*
            Loads or creates the database. 

            Sets

            this.db
            this.user - A user object with keys: username, token
        */

        // Makes the loki database available at $vpApi.db.
        console.log("$vpApi.dbinit]")
        obj.db = window.data.db;
        
        if (obj.db.collections.length === 0){
            console.error("[$vpApi.dbinit()] There are no collection in the database. Try removing ng-app from you index.html.")
        };
        obj.user = data.user;
        obj.users = data.db.getCollection('user');
        obj.dbLoaded = true;
        // Add listeners to generate uuid's 
        var col = obj.db.getCollection('fsResp');

        
        col.setChangesApi(true);
        col.on('insert', function(item){
            if (!item.id){
                item.id = obj.generateUUID();
            }

        });

        col = obj.db.getCollection('formResp');
        col.setChangesApi(true);
        col.on('insert', function(item){
            if (!item.id){
                item.id = obj.generateUUID();
            }

        });

        col = obj.db.getCollection('blockResp');
        col.setChangesApi(true);
        col.on('insert', function(item){
            if (!item.id){
                item.id = obj.generateUUID();
            }

        });

        col = obj.db.getCollection('answer');
        col.setChangesApi(true);
        col.on('insert', function(item){
            if (!item.id){
                item.id = obj.generateUUID();
            }
        });

        obj.db.save(); // This is required in order for the UUID's and the changes API to work.

        if(typeof(initCallback) == 'function'){
            initCallback();
        }
        return;

    }


    this.generateUUID = function() {
        var d = new Date().getTime();
        var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = (d + Math.random()*16)%16 | 0;
            d = Math.floor(d/16);
            return (c=='x' ? r : (r&0x3|0x8)).toString(16);
        });
        return uuid;
    };


    this.getApp = function(slug){
        /*
        If slug is provded, returns that app with that slug. If
        no slug is provided, it returns the first app it finds. 
        If no apps are present it will error out.
        */

        var apps = obj.db.getCollection('app');
        var app = null;
        if(slug == undefined || slug == null){
            app = apps.find()[0];
        }else{
            app = apps.find({'slug':slug})[0];
        }
        return app;
    }


    this.getFormstack = function(slug){
        var out = null;
        var formstacks = obj.db.getCollection('formstack')
        if(slug == undefined || slug == null){
            out = formstacks.find()[0];
        }else{
            out = formstacks.find({'slug':slug})[0]
        }
        if(!out)
            console.warn('[$vpApi.getFormstack()] Could not find formstack');

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
                var users = obj.users.find({'username': res.username});
                if (users.length === 0){
                    user = obj.users.insert({'username':res.username, token:res.token});
                } else {
                    user = users[0];
                    user.token = res.token;
                    user.username = res.username;
                    obj.users.update(user);
                }
                obj.user = user;
                obj.db.save();
                localStorage.setItem('user', JSON.stringify(obj.user));
                $rootScope.$broadcast('authenticated', {onSuccess: success_callback, onError: error_callback});
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
          console.log("get fail");
          fail(data, status);
        });
    }

    this.ping = function() {
        var url = apiBase+"pforms/ping/";
        var qs = {};
        var config = {headers: {'Authorization':'Token ' + this.user.token}};
        $http.get(url, config).success(function(data, status){
          console.log("ping success");
          $rootScope.$broadcast('sync-network', {msg:'Connected to ' + config.apiBaseUri});
        })
        .error(function(data, status){
          console.log("ping fail");
          $rootScope.$broadcast('sync-no-network', {msg:'Cannot connected to ' + config.apiBaseUri});
        });
    };

    this.post = function(resource, data, success, fail){
        var url = apiBase + resource + '/';
        var config = {headers: {'Authorization':'Token ' + this.user.token}};
        $http({
              url:url,
              
              method:'POST',
              data: data,
              headers: {'Authorization':'Token ' + this.user.token, 'Content-Type': 'application/json; charset=utf-8'}
        }).success(function(data, status){
          success(data, status);
        })
        .error(function(data, status){
          fail(data, status);
        });
    };

    this.put = function(resource, data, success, fail){
        var url = apiBase + resource + '/';
        var config = {headers: {'Authorization':'Token ' + this.user.token}};
        $http({
              url:url,
              method:'PUT',
              data: data,
              headers: {'Authorization':'Token ' + this.user.token, 'Content-Type': 'application/json; charset=utf-8'}
        }).success(function(data, status){
          success(data, status);
        })
        .error(function(data, status){
          fail(data, status);
        });
    };


    this.patch = function(resource, data, success, fail){
        /*
            Use this for partial updates to an endpoint.

        */
        var url = apiBase + resource + '/';
        var config = {headers: {'Authorization':'Token ' + this.user.token}};
        $http({
              url:url,
              method:'PATCH',
              data: data,
              headers: {'Authorization':'Token ' + this.user.token, 'Content-Type': 'application/json; charset=utf-8'}
        }).success(function(data, status){
          success(data, status);
        })
        .error(function(data, status){
          fail(data, status);
        });
    };


    this.delete = function(resource, success, fail){
        var url = apiBase + resource + "/";
        $http({
              url:url,
              method:'DELETE',
              headers: {'Authorization':'Token ' + this.user.token, 'Content-Type': 'application/json; charset=utf-8'}
        }).success(function(data, status){
          success(data, status);
        })
        .error(function(data, status){
          fail(data, status);
        });
    };

    this.passwordChange = function(data) {
        /*
        Data should contain keywords: old_password, new_password1, new_password2

        Returns a promise. If it fails the promise will return an 'errors' array.
        */
        var defer = $q.defer();
        var resource = "account/password/change";
        obj.post(resource, data, function(data, res){
            defer.resolve(data[0], status);
        }, function(data, res){
            defer.reject(data, status);
        });
        return defer.promise;
    };

    this.showCollection = function(collectionName){
        console.log("SHOW TABLE: " + collectionName);
        console.table(data.db.getCollection(collectionName).data);
    }

    if (window.data) {
        console.log("[$vpApi] About to call dbinit()");
        this.dbinit();

    }

}])

.service('$user', ['$rootScope', 
                   '$vpApi',
                   '$app',
                   '$formstack',
                   '$profile',
                   'config',
          function($rootScope, 
                   $vpApi, 
                   $app, 
                   $formstack, 
                   $profile, 
                   config
                   ){
    var obj = this;

    this.authenticatedCallback = function(event, args){
        /*
            This will call the args.onSuccessCallback (because the user did authenticate by this pont)
            with data = {} and 
            status = 1 if there were allowedApps and was able to fetch them.
            status = 2 if there we no allowed apps for the user or the acceptedApp 
                       was not in the allowedApps.
            status = 3 if there were alledApps but fetching failed            
            
        */

        $profile.fetch(function(){
            console.log("Got profile")
            $vpApi.db.save(); // This is to save the profile to indexedDB.

            var allowedApps = $vpApi.user.profile.allowed_apps;
            var appSlug;

            if (allowedApps.length > 0) {
                 if (config.acceptedAppType) {
                    // Look for accepted app in allowed apps.
                    var res = _.find(allowedApps, function(item){
                        return (item.appType === config.acceptedAppType);
                    });
                    if (res){
                        appSlug = res.appSlug;
                    } else {
                        args.onSuccess({}, 2)
                        return;
                    }
                } else {
                    // This is left in for past apps, just use first app. 
                    appSlug = allowedApps[0].appSlug;
                }
            
            } else {
                console.warn("There are no allowed Apps for this user.");
                // TODO Handle the no formstack case.
                args.onSuccess({}, 2);
                return;
            }

            // Now use the allowed_apps to get first app.
            $app.fetchBySlug(appSlug,
                function(data, status){
                    console.log('Got app ', data)
                    formstacks = data["formstacks"];
                    //Clear data
                    $vpApi.db.getCollection('formstack').clear();
                    
                    // Insert Most recent Fromstack data
                    _.each(formstacks, function(formstack){
                        formstack.appId = data.id;
                        formstack.appSlug = data.slug;
                        $vpApi.db.getCollection('formstack').insert(formstack);

                        item = {
                            "status": "success",
                            "attempts": 1,
                            "lastAttempt": $vpApi.getTimestamp(),
                            "method": "GET",
                            "resourceUri": "/api/v2/pforms/formstack/" + formstack.id,
                            "resourceId": formstack.id,
                        }
                        $vpApi.db.getCollection('statusTable').insert(item);
                    });

                    // Save the changes
                    $vpApi.db.save();
                    $rootScope.$broadcast('apploaded');
                    args.onSuccess({}, 1);
                },
                function(data, status){
                    console.log('[$user] failed to fetch formstack');
                    console.log(data);
                    args.onSuccess({}, 3);
                }
            );
        },
        function(data, status){
            console.log('Error fetching profile.');
        });
    };

    $rootScope.$on('authenticated', function(event, args){
        obj.authenticatedCallback(event, args);
    });

}])

.service( '$org', ['$vpApi', '$q', function($vpApi, $q){
    var obj = this;

    this.update = function(data){
        /*
        Updates a user's profile. 
        */
        var defer = $q.defer();
        var resource = 'account/org/'+$vpApi.user.profile.orgs[0].id;
        $vpApi.patch(resource, data, function(data, status){
            $vpApi.user.profile.orgs[0] = data;
            $vpApi.db.save();
            defer.resolve(data, status);
        }, function(data, status){
            defer.reject(data, status)
        })

        return defer.promise;
    }
}])


.service( '$profile', ['$http', '$vpApi', '$q', 'config', function($http, $vpApi, $q, config){
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
                if (data.length === 0) console.error("[$profile.fetch() User profile not found.]");
                $vpApi.user.profile = data[0];
                $vpApi.users.update($vpApi.user);
                successCallback();
            }).error(function(data, status){
                errorCallback()
            });
    };

    this.update = function(data){
        /*
        Updates a user's profile. 
        */
        var defer = $q.defer();
        var resource = 'account/profile/'+$vpApi.user.profile.id;
        $vpApi.patch(resource, data, function(data, status){
            $vpApi.user.profile = data;
            $vpApi.db.save();
            defer.resolve(data, status);
        }, function(data, status){
            defer.reject(data, status)
        })

        return defer.promise;
    }

}])

.service('$app', ['$vpApi', '$rootScope', '$q', function($vpApi, $rootScope, $q) {
    var obj = this;
    this.resource_name = 'pforms/get/app';

    this._fetchSuccess = function(data, status){
        obj.objects = data;
        var apps = $vpApi.db.getCollection('app');
        var app = apps.find({'slug':data[0].slug});
        if (app.length > 0){
            apps.remove(app);
        }
        apps.insert(data[0]);
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

                var apps = $vpApi.db.getCollection('app');
                var app = apps.find({'slug':slug});
                if (app.length > 0){
                    apps.remove(app);
                }
                apps.insert(data[0]);
                successCallback(data[0], status);
            },
            function(data, status){
                errorCallback(data, status)
            }
          );

        }else{
            
            console.warn("[$app.fetchBySlug()] No network connection.");
        }

    }; // fetchBySlug


    this.fetchBySlug2 = function(slug, successCallback, errorCallback){
        /*
        Get the formstack from the VP2 server. 
        Same as fetchBySlug but returns a promise.
        */
        var defer = $q.defer();

        if(HAS_CONNECTION){
          $vpApi.fetch(this.resource_name, {'slug':slug}, 
            function(data, status){
                obj.objects = data;

                var apps = $vpApi.db.getCollection('app');
                var app = apps.find({'slug':slug});
                if (app.length > 0){
                    apps.remove(app);
                }
                apps.insert(data[0]);
                defer.resolve(data[0], status);
                //successCallback(data[0], status);
            },
            function(data, status){
                defer.reject(data, status);
            }
          );

        }else{
            defer.reject({}, "Network not found");
        };
        return defer.promise;

    }; // fetchBySlug
    
    this.updateBySlug = function(slug, lastTimestamp, success, error) {
        /*
        Inputs:
            slug - [String]
            lastTimestamp: [ISO 8601 String] last time the formstack was updated. 
            success - [Function] the success callback. This will called with arguements 
                        formstack, status from the $http.get. 
            
            error -  [Fucntion] the error callback. This will be called with arguments 
                         data, status from the $http.get
        */
        
        var resource_name = obj.resource_name;
        var data = {'slug':slug};
        if (lastTimestamp){
            data.modified_gte = lastTimestamp;
            resource_name = "pforms/app";
        }
                
        $vpApi.fetch(resource_name, data, 
            function(data, status){
                
                //app = $vpApi.getApp();
                // Update all fields that are not the formstacks.
                app = null;
                if (data.length === 1){
                    app = data[0];
                }
                success(app, status, slug);
            },
            function(data, status){
                obj._fetchFail(data, status, slug);
                error(data, status);
            }
        );
    };

}])

.service('$formstack', ['$vpApi', '$rootScope', function($vpApi, $rootScope) {
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
                $rootScope.$broadcast('formstack-updated', slug);
                successCallback(data[0], status);
            },
            function(data, status){
                console.log("Failed to fetch " + obj.resource_name + ". Returned Status: " + status);
                console.log(data);
                errorCallback(data, status)
            }
          );

        }else{
            console.warn("[$vpApi-services.fetchBySlug()] No network connection.");
        }

    }; // fetchBySlug

    this.updateBySlug = function(slug, lastTimestamp, success, error) {
        /*
        Inputs:
            slug - [String]
            lastTimestamp: [ISO 8601 String] last time the formstack was updated. 
            success - [Function] the success callback. This will called with arguements
                        formstack, status from the $http.get.

            error -  [Fucntion] the error callback. This will be called with arguments
                         data, status from the $http.get
        */

        var data = {'slug':slug};
        if (lastTimestamp){
            data.modified_gte = lastTimestamp;
        }

        $vpApi.fetch(this.resource_name, data,
            function(data, status){
                var fs = null;
                if (data.length > 0) {
                    obj._fetchSuccess(data, status, slug);
                    fs = data[0];
                    $rootScope.$broadcast('formstack-updated', slug);
                }
                success(fs,status, slug);
            },
            function(data, status){
                obj._fetchFail(data, status, slug);
                error(data, status, slug);
            }
        );
    };

    this.getQuestionBySlug = function(fsSlug, qSlug) {
        var fs = $vpApi.db.getCollection('formstack').find({'slug': fsSlug})[0];
        var out;
        _.find(fs.forms, function(form){
            blockRes = _.find(form.blocks, function(block){
                qRes = _.find(block.questions, function(q){
                    if (q.slug === qSlug){
                        out = q;
                        return true;
                    }
                });
                return qRes;
            });
            return blockRes;
        });
        return out;
    };

    this.getChoice = function(fsSlug, qSlug, value){
        /*
            Get's a questions choice by question slug and value.
            Handles the 'other' answer case
        */
        var choice;
        var question = obj.getQuestionBySlug(fsSlug, qSlug);
        choice = _.find(question.choices, function(item){return(item.value === value);});
        if (!choice) {
            choice = {'verbose': 'User Enter: ' + value, 'value': value };
        }
        return choice;
    };



    this.getSlugs = function(){
        var out = [];
        formstacks = $vpApi.db.getCollection('formstack').data;
        out = _.map(formstacks, function(fs){
            return fs.slug;
        })
        return out;
    }

}])

.service('$fsResp', ['$vpApi', '$rootScope', '$q', function($vpApi, $rootScope, $q){
    /*
        A form response is of the form
        {
            id:
            fsSlug:
        }
    */

    var obj = this;
    

    $rootScope.$on('db_loaded', function(e){
        this.objects = $vpApi.db.getCollection('fsResp');
    });

    this.clear = function(){
        /*
        Deletes all responses and children
        */

        var fsResps = $vpApi.db.getCollection('fsResp');
        var formResps = $vpApi.db.getCollection('formResp');
        var blockResps = $vpApi.db.getCollection('blockResp');
        var answers = $vpApi.db.getCollection('answer');
    
        fsResps.clear();
        formResps.clear();
        blockResps.clear();
        answers.clear();

        $vpApi.db.save();
    };

    this.delete = function(fsRespId, callback){
        /*

        A cascading delete for fsResps, this will delete the children of the fsResp.
        
        */

        $vpApi.db.getCollection('fsResp').removeWhere({'id': fsRespId});
        $vpApi.db.getCollection('formResp').removeWhere({'fsRespId': fsRespId});
        $vpApi.db.getCollection('blockResp').removeWhere({'fsRespId': fsRespId});
        $vpApi.db.getCollection('answer').removeWhere({'fsRespId': fsRespId});

        $vpApi.db.save(function(){
            if(typeof(callback) == "function")
                callback();
        });

        console.log("[$fsResp.delete()] Deleted all responses. About to broadcast fsResp-deleted for " + fsRespId);
        $rootScope.$broadcast('fsResp-deleted', {fsRespId: fsRespId});
    }

    this.fetchByFormstackSlug = function(fsSlug){
        /*
        Returns a promise.
        */ 

        var defer = $q.defer();

        $vpApi.fetch("pforms/formstack-response", {"formstack__slug":fsSlug}, function(data, status){
            // Success, add the formstack responses
            if (data.results.length > 0){
                obj.loadResponses(data.results);
            };
            defer.resolve(data.results, status);
        }, function(data, status){
            // Fail
            defer.reject(data.results, status)
        });
        return defer.promise;
    }

    this.fetchByRespId = function(fsRespId){
        /*
        Returns a promise.
        */ 

        var defer = $q.defer();

        $vpApi.fetch("pforms/formstack-response/"+fsRespId, {}, function(data, status){
            // Success, add the formstack responses
            obj.loadResponses([data]);
            defer.resolve(data, status);
        }, function(data, status){
            // Fail
            defer.reject(data, status)
        });
        return defer.promise;
    }

    this.loadResponses = function(fsRespNested) {
        /*
        This function is used to load the fsResp nested json object returned
        from the /api/v2/pforms/formstack-response/ endpoint.
        */

        console.log("[loadResponses]")
        _.each(fsRespNested, function(fsResp){
            var formResps = angular.copy(fsResp.formResps);
            fsResp.formResps = undefined;
            $vpApi.db.getCollection('fsResp').insert(fsResp);

            _.each(formResps, function(formResp){
                blockResps = angular.copy(formResp.blockResps);
                formResp.blockResps = undefined;
                formResp.fsSlug = fsResp.slug;
                $vpApi.db.getCollection('formResp').insert(formResp);
       
                _.each(blockResps, function(blockResp){
                    answers = angular.copy(blockResp.answers);
                    blockResp.answers = undefined;
                    blockResp.fsSlug = fsResp.slug;
                    blockResp.formId = formResp.formId
                    $vpApi.db.getCollection('blockResp').insert(blockResp);
                    _.each(answers, function(ans){
                        ans.formId = formResp.formId;
                        ans.blockId = blockResp.blockId;
                        ans.fsSlug = fsResp.slug;
                        $vpApi.db.getCollection('answer').insert(ans);
                    });
                });
            });
        });
    }

    this.getFullResp = function(fsRespId){
        /*

        Creates a full nested formstack response object for syncing.
        
        Params: The UUID of the fsResp.

        Returns
        {
            fsId:
            fsRespId:
            formResps: [
                {
                    formId:
                    formRespId:
                    blockResps: [
                        blockId:
                        blockRespId:
                        answers: [
                            questionId:
                            value:
                        ]
                    ]
                },
                .
                .
                .
                {
                    formId:
                    formRespId:
                    block: []
                }
            ]

        }
        */
        var blockResps, formResps, answers;
        out = {};

        // Get fs Info
        var item = $vpApi.db.getCollection('fsResp').find({id:fsRespId})[0];
        var lastUrl = $vpApi.db.getCollection("lastSavedUrl").data[0];
        var lastSavedUrl = {};
        if (lastUrl){
            lastSavedUrl = {
                "path": lastUrl.path,
                "timestamp": lastUrl.timestamp
            }
        }
        fsResp = angular.copy(item);
        fsResp.meta = undefined;
        fsResp.fsSlug = undefined;
        fsResp.$loki = undefined;
        fsResp.options = {
            'lastSavedUrl': lastSavedUrl
        };
        fsResp.formResps = [];

        // Get the form resps
        formResps = angular.copy($vpApi.db.getCollection('formResp').find({'fsRespId':fsRespId}));
        _.each(formResps, function(formResp){
            blockResps = angular.copy($vpApi.db.getCollection('blockResp').chain()
                .find({'fsRespId':fsRespId})
                .find({'formRespId': formResp.id})
                .data());
            
            _.each(blockResps, function(blockResp){
                answers = angular.copy($vpApi.db.getCollection('answer').chain()
                    .find({'fsRespId':fsRespId})
                    .find({'formRespId': formResp.id})
                    .find({'blockRespId': blockResp.id})
                    .data());
                _.each(answers, function(ans){
                    // Clean the answers
                    if (ans.value === undefined) ans.value = null;
                });
                blockResp.answers = answers;
                // blockResp.client_created = blockResp.ccreated;
                // blockResp.client_updated = blockResp.cupdate;

                // _.each(blockResp.answers, function(ans){
                //     ans.client_created = ans.ccreated;
                //     ans.client_updated = ans.cupdate;
                // })
            })
            formResp.blockResps = blockResps;
            

            fsResp.formResps.push(formResp);
        });

        return fsResp;
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

    this.delete = function(formRespId, callback){
        /*
        A cascading delete for formResps, this will delete the children of the formResp.

        */

        $vpApi.db.getCollection('formResp').removeWhere({'id': formRespId});
        $vpApi.db.getCollection('blockResp').removeWhere({'formRespId': formRespId});
        $vpApi.db.getCollection('answer').removeWhere({'formRespId': formRespId})

        $vpApi.db.save(function(){
            if(typeof(callback) == "function")
                callback();
        });
    }
}])

.service('$blockResp', ['$vpApi', '$sync', '$rootScope', function($vpApi, $sync, $rootScope){
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

    this.delete = function(blockRespId, callback){
        /*
        Deleting entire block responses

        */
        $vpApi.db.getCollection('blockResp').removeWhere({'id': blockRespId});
        $vpApi.db.getCollection('answer').removeWhere({'blockRespId': blockRespId})

        $vpApi.db.save(function(){
            if(typeof(callback) == "function")
                callback();
        });
    }


    /********************** ADDED FROM MARKET-DASHBOARD *******************/

    obj.reset = function(questions) {
        _.each(questions, function(q){
            q.value = "";
            if (q.form === undefined){
                q.form = {};
            }
            q.form.show = true;
            q.answerId = null;
            if (q.options && q.options.widget && platform === 'web') {
                q.options.widget = q.options.widget.replace("hybrid/", "web/");
            }
        });
    };

    obj.load = function(fsRespId, formRespId, blockRespId, questions){
        /*
        data - An object whose key words are question slugs.


        Get the previous answers to questions and assigns them to q.value for each quesiton
        in the block. If there are no previous answers the question.value is assign to question.options.default
        or a blank string if no default is present.

        */

        var isNew = false;
        var previousAnswers;
        var answers = $vpApi.db.getCollection("answer");

        formRespId = formRespId + "";
        blockRespId = blockRespId + "";

        if (fsRespId === 'new'
            || formRespId.split('-')[0] === 'new'
            || blockRespId.split('-')[0] === 'new') isNew = true;

        if (isNew){
            previousAnswers = [];
        } else {
            previousAnswers = answers.chain()
               .find({'fsRespId': fsRespId})
               .find({'formRespId': formRespId})
               .find({'blockRespId': blockRespId})
               .data();
        };

        console.table(previousAnswers);

        // Loop over answers and set defaults
        _.each(questions, function(q){
            // Get the answer for the question
            var ans = _.find(previousAnswers, function(pans){
                return (pans.questionId === q.id);
            });


            if (ans) {
                q.value = ans.value;
                q.previousValue = ans.value;
                q.answerId = ans.id;
            } else if ( typeof(q.options['default']) !==  'undefined'){
                q.value = q.options['default'];
                q.previousValue = q.options['default'];
                q.answerId = null;
            } else {
                q.value = '';
                q.previousValue = '';
                q.answerId = null;
            }
        });

        return questions;
    };


    obj.save = function(fsRespId, formRespId, blockRespId, questions, status, formForEachItem){
        if (!obj.isValid(questions)){
            $rootScope.$broadcast('block-invalid');
            return;
        }
        status = status || 'submitted';

        var fsResps = $vpApi.db.getCollection('fsResp');
        var formResps = $vpApi.db.getCollection('formResp');
        var blockResps = $vpApi.db.getCollection('blockResp');
        var answers = $vpApi.db.getCollection('answer');

        var fs;
        var fsResp = formResp = blockResp = formId = formIndex = blockId = blockIndex = null;
        

        if (fsRespId.split("new-").length === 2) {
            fsId = parseInt(fsRespId.split("new-")[1],10);
            fsRespId = 'new';
            fs = $vpApi.db.getCollection('formstack').find({'id':fsId})[0];
        } else {
            fsResp = fsResps.find({'id':fsRespId})[0];
            fs = $vpApi.db.getCollection('formstack').find({'id':fsResp.fsId})[0];
        }

        if (formRespId.split("new-").length === 2){
            formId = parseInt(formRespId.split("new-")[1], 10);
            formRespId = 'new';
            formIndex = _.findIndex(fs.forms, function(form){
                return form.id === formId;
            });
        } else {
            formResp = formResps.find({'id':formRespId})[0];
            formIndex = _.findIndex(fs.forms, function(form){
                return form.id === formResp.formId;
            });
        }
        if (blockRespId.split("new-").length === 2){
            blockId = parseInt(blockRespId.split("new-")[1],10);
            blockRespId = 'new';
            blockIndex = _.findIndex(fs.forms[formIndex].blocks, function(block){
                return block.id === blockId;
            });
        } else {
            blockResp = blockResps.find({'id':blockRespId})[0];
        }

        var isValid = true;
        if (isValid){
            // I need to save the answers here.
            
            // Create a new blockResponse and formResponse if this is a new-form and new-block
            if (fsRespId === 'new') {
                fsResp = fsResps.insert({
                    'id': $vpApi.generateUUID(),
                    'fsId': fs.id,
                    'fsSlug':fs.slug,
                    'client_updated': $vpApi.getTimestamp(),
                    'client_created': $vpApi.getTimestamp(),
                    'status': status
                });
            } else {
                // The fsResp already exists, so just need to update cupdate. 
                fsResp.client_updated = $vpApi.getTimestamp();
                fsResps.update(fsResp);
            }

            if (formRespId == 'new') {
                formResp = formResps.insert({
                    'id': $vpApi.generateUUID(),
                    'fsSlug':fs.slug,
                    'fsRespId': fsResp.id,
                    'formId': formId,
                    'formIndex': formIndex,
                    'formForEachItem': formForEachItem || null,
                    'client_updated': $vpApi.getTimestamp(),
                    'client_created': $vpApi.getTimestamp()
                });

            } else {
                // formResp already exists, just update the timestamp.
                formResp.client_updated = $vpApi.getTimestamp();
                formResps.update(formResp);
            }

            if (blockRespId === 'new') {
                blockResp = blockResps.insert({
                    'id': $vpApi.generateUUID(),
                    'fsSlug':fs.slug,
                    'fsRespId': fsResp.id,
                    'formId': formId,
                    'formIndex': formIndex,
                    'formRespId': formResp.id,
                    'formForEachItem':formForEachItem || null, // This is used by form-foreach
                    'blockId': blockId,
                    'blockIndex': blockIndex,
                    'client_updated': $vpApi.getTimestamp(),
                    'client_created': $vpApi.getTimestamp()
                });
            } else {
                blockResp.client_updated = $vpApi.getTimestamp();
                blockResps.update(blockResp);
            }

            // Need to actaully save the answers here.
            _.each(questions, function(q){
                if (!q.answerId) {
                    
                    answers.insert({
                        'id': $vpApi.generateUUID(),
                        'value': q.value,
                        'questionId': q.id,
                        'questionSlug': q.slug,
                        'blockRespId': blockResp.id,
                        'blockId': blockId,
                        'formRespId': formResp.id,
                        'formId': formId,
                        'formForEachItem':formForEachItem || null,
                        'fsRespId': fsResp.id,
                        'fsSlug': fs.slug,
                        'client_updated': $vpApi.getTimestamp(),
                        'client_created': $vpApi.getTimestamp(),
                    });
                } else {
                    var answer = answers.find({id:q.answerId})[0];
                    answer.value = q.value
                    answer.client_updated = $vpApi.getTimestamp()
                    answers.update(answer);
                }
                
            });
            
            // Clear any previous answers
            // _.each(questions, function(q){
            //     q.value = "";
            // });
            
            $vpApi.db.save();
            if (platform === 'web') {
                $sync.run(function(){});
            };

            console.log("******* Block successfully save *********");
            $rootScope.$broadcast('block-saved', blockResp);
            return fsResp;
        } // End if is_valid()
    }; // End save()



    obj.isValid = function(questions) {
        /* 
        Loop over each question in the block and run the clean and validate functions.
        
        Returns boolean;
        */

        var out = true;
        _.each(questions, function(q){
            
            console.log("question", q)
            q.form.clean_answer();
            var isValid = q.form.validate_answer();
            if (!isValid){
                out = false;
            } 
        });
        return out;
    };
    /********************** END FROM MARKET-DASHBOARD STUFF *******************/

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

    this.delete = function(answerId, callback){
        /*
        Deleting entire block responses

        */
        $vpApi.db.getCollection('answer').removeWhere({'id': answerId});
        $vpApi.db.save(function(){
            if(typeof(callback) == "function")
                callback();
        });

    }  

}])

.service('$masterList', [ '$rootScope', '$vpApi', '$q', function($rootScope, $vpApi, $q){
    var obj = this;
    obj.current = {
        resourceName: '',
        table: [],
        item: {}
    }
    obj.new = {};

    obj.fetchTable = function(resourceName){
        /*
            resourceName is the name of the API endpoint.
        */
        var defer = $q.defer();
        obj[resourceName] = [];
        var params = {};
        
        $vpApi.fetch('lookup/'+resourceName, params, function(data, status){
            obj[resourceName] = data;
            $rootScope.$broadcast('lookup-table-loaded', resourceName);
            defer.resolve(data, status);
        }, function(data, status){
            console.log("[fetchTable] failed", data);
            defer.reject(data, status);
        });

        return defer.promise;
    }



    // obj.fetchTable('Species');
    // obj.fetchTable('Port');
    // obj.fetchTable('GearType');
    // //obj.fetchTable('Unit');
    // obj.fetchTable('StartForm');
    // obj.fetchTable('TargetForm');

}])


angular.module('vpApi.services')

.service( '$sync', ['$rootScope', 
                    '$http', 
                    'config', 
                    '$vpApi',
                    '$app',
                    '$formstack',
                    '$fsResp',
                    '$timeout',
            function($rootScope, 
                     $http, 
                     config, 
                     $vpApi,
                     $app,
                     $formstack, 
                     $fsResp,
                     $timeout
                     ) {

    /*
    Handles all syncing. Just wrap it in a setInterval.

    Also listens for 'db.save' event and will just run pushFsResps() to save to server. 
    
    Broasdcasts - 
    - sync-start
    - sync-fail - Also sends errors lists. Fires if one or more formstack resps fails.
    - sync-success - Also sends success list. Fires only if all formstack resps were successful
    - sync-complete - Fires when sycing is done, regardless of status. 
    - sync-network - Fired by checkConnection if connection to vp2 is made.
    - sync-no-network - Fired y checkConnection if connection fails.


    */
    var VERBOSE = window.VERBOSE || false;  // Set to true to turn on console.logs.
    var obj = this;
    this.toasDuration = 3000;
    this.intervalHandle = null; // A handle for the setInterval that runs the sync.
    this.collections = ['fsResp', 'formResp', 'blockResp', 'answer'];
    this.lastUpdate = localStorage.getItem('lastUpdate');
    this.statusTable = $vpApi.db.getCollection('statusTable');

    if (this.lastUpdate) {
        this.lastUpdate = new Date(this.lastUpdate);
    }

    this.run = function(callback){
        /*
        This function can be ran on a periodic timer or called by itself.
        It will look for submitted responses and send them to the server
        
        There is a slight added before running. This is to deal with the case
        where the function is called directly after saving a block to account
        for the delayed generation of the changes object and the UUID's.

        */

        obj.checkConnection();
        $timeout(function(){
            $rootScope.$broadcast('sync-start');
            var fsResps; // Responses to submit
            if (window.HAS_CONNECTION !== true) {
                console.warn("[sync.run()] No network found, sync cancelled.");
                $rootScope.$broadcast('sync-no-network');
                return;
            }

            if (!$vpApi.user) {
                console.warn("[sync.run()] No user found, sync cancelled.");
                $rootScope.$broadcast('sync-fail', {"errors":["No user found, sync cancelled."]});
                return;
            }

            onSucess = function(data, status) {
                $rootScope.$broadcast('sync-success', data);
                callback(data, status);
                $vpApi.db.clearChanges();
                $rootScope.$broadcast('sync-complete');
            };

            onError = function(data, status) {
                if (VERBOSE === true) console.log('[$sync.run.OnError] ', data.fail);
                $rootScope.$broadcast('sync-fail', data.fail);
                $rootScope.$broadcast('sync-complete');
            };

            // Get the list of fsResps that need to be synced, and push them to
            // the server.
            fsResps = obj.getFsResps();
            if (fsResps.length > 0) {
                obj.pushFsResps(fsResps, onSucess, onError);
            }

            // Remove any old synced responses
            obj.clearSyncedFormstacks();

            // Update readonly resources
            obj.updateReadOnly();


            }, 1000);
    };

    this.checkConnection = function(){
        $vpApi.ping();
    }

    this.getFsResps = function(){
        /*
        
        Returns a list of formstacks to sync. The formstack are based on what has changed and
        what is in status of pending. 
        */ 

        var changes = $vpApi.db.generateChangesNotification(['fsResp']);
        var fsResps = [];
        
        if (VERBOSE === true) console.log("[sync.run()] Changes: " + _.map(changes, function(item){if (VERBOSE === true) console.log(item);}) );

        // Get formstacks that have changed since the last sync. 
        if (changes.length > 0){
            fsResps = _.map(changes, function(change){
                if (VERBOSE === true) console.log("change.obj.id: ")
                if (VERBOSE === true) console.log(change.obj.id)
                if (!change.obj.id) return null;  // Insert operations have no ID. That is done after the insert.
                var fsRespObj = $vpApi.db.getCollection('fsResp').chain()
                    .find({'id':change.obj.id})
                    .find({'status':{'$ne':'rejected'}})
                    .data();
                if (VERBOSE === true) console.log(fsRespObj);
                if (fsRespObj.length > 0){
                    return angular.copy(fsRespObj[0]);
                }
            });
        };

        fsResps = _.compact(fsResps);
        var unique = _.uniq(fsResps, function(item) { 
            return item.id;
        });


        fsResps = _.compact(unique);
        console.log("First query resps", fsResps)
        if (VERBOSE === true) console.log("[sync.run()] found "+fsResps.length+" fsResps that changed");
        
        // Get unsynced responses, these are ones that failed to sync because offline.
        var resps = $vpApi.db.getCollection('statusTable').chain()
                        .find({"collection": "fsResp"})
                        .find({"status": "pending"})
                        .data();
        
        var staleResps = [];
        if (resps.length > 0) {
            staleResps = _.map(resps, function(resp){
                var item = $vpApi.db.getCollection('fsResp').chain()
                    .find({'id':resp.resourceId})
                    .find({'status': {'$ne':'rejected'}});
                if (item.length > 1){
                    console.warn("[sync.getFsResps] Found more than one fsResp")
                }
                return item[0];
            });
        }

        if (VERBOSE === true) console.log("[sync.run()] found "+staleResps.length+" 'pending' fsResps");
        staleResps = _.compact(staleResps);
        console.log("Stale resps", staleResps)

        fsResps = fsResps.concat(angular.copy(staleResps));

        return fsResps;
    };


    this.pushFsResps = function(resps, onSucess, onError) {
        /*

        This function POST's the formstack respoinses to the
        /pforms/formstack/<ID>/submit endpoint.

        */

        if (VERBOSE === true) console.log("[sync.pushFsResps()] Attempting to sync resp, count: " + resps.length)
        var fsFullResp; // This will be the full nested formstack response.
        var fsResp;
        var count = 0;
        var successCount = 0;
        var failCount = 0;
        var results = {success:[], fail:[]};
        var resource;
        var statusTable = $vpApi.db.getCollection('statusTable');
        var fsResps = $vpApi.db.getCollection('fsResp');
        var item;
        
        submitSuccess = function(data, status){
            // Update statusTable
            item = statusTable.find({'resourceId':data.id})[0];
            item.status = 'success';

            fsResp = $vpApi.db.getCollection('fsResp').find({"id":data.id})[0];

            // Update record's status to synced to lock it if it was submitted.
            fsResp.status = data.status;
            fsResp.syncedAt = $vpApi.getTimestamp();
            $vpApi.db.save();

            var msg = data.id + " - "+data.fsSlug+ " Formstack response successully synced.";
            results.success.push(msg);
            count++;
            successCount++;
            if (count === resps.length) {
                // This is the last response.
                if (VERBOSE === true) console.log("[sync.pushFsResps()] " + successCount +" successully sumbitted, "+ failCount + " failed.");
                finishedSubmitting();
            }
        }

        submitFail = function(data, status){
            /*
            Date containd keywords:
            - errors
            - id
            - status
            - operations

            */
            var item;
            if (VERBOSE === true) console.log('I failed ' + status);
            $rootScope.$broadcast('sync-failed', {data:data, status:status});
            // Update statusTable
            
            if (data.status === 'rejected'){
                // This means the server-side post processing was rejected, but the response still saved.
                item = fsResps.find({'id':data.id})[0];
                item.status = 'rejected';
                item.errors = data.errors;
                fsResps.update(item);

                item = statusTable.find({'resourceId':data.id})[0];
                item.status = 'success';
                statusTable.update(item);
            } else {
                // This is the original case.
                item = statusTable.find({'resourceId':data.id})[0];
                item.status = 'fail';
                statusTable.update(item);
            }
            $vpApi.db.save();


            var msg = data.id + " - "+data.fsSlug+ " Formstack response successully synced.";
            var errorObj = {
                fsRespId:data.id,
                errors: data.errors
            }
            results.fail.push(errorObj);
            count++;
            failCount++;
            if (count === resps.length) {
                // This is the last response.
                finishedSubmitting();
            }
        }


        finishedSubmitting = function(){
            
            if (results.fail.length === 0){
                onSucess(results, 'Finished submitting formstacks.');
            } else {
                onError(results, 'Finished submitting formstacks with errors.');
            }
            
        }

        _.each(resps, function( resp ){
            fsFullResp = $fsResp.getFullResp(resp.id);
            resource = "pforms/formstack/"+fsFullResp.fsId+"/submit";
            
            // Update status table
            var statusTable = $vpApi.db.getCollection('statusTable');
            var item = statusTable.find({'resourceId':resp.id});

            if (item.length === 0) {
                // This must be a new attempt
                item = {
                    "status": "pending",
                    "attempts": 1,
                    "lastAttempt": $vpApi.getTimestamp(),
                    "method": "POST",
                    "resourceUri": resource,
                    "collection": "fsResp",
                    "resourceId": resp.id
                }

                statusTable.insert(item);
            } else {
                item.status = 'pending';
                item.attempts++;
                item.lastAttempt = $vpApi.getTimestamp();
                statusTable.update(item);
            }
            $vpApi.db.save();
            $vpApi.post(resource, fsFullResp, submitSuccess, submitFail);
        });
        
    };

    this.clearSyncedFormstacks = function(){
        var dt, syncedAt, item;
        var now = new Date();
        var olds = $vpApi.db.getCollection('fsResp').chain()
            .find({'status':'synced'})
            .where(function(resp) {
                syncedAt = new Date(resp.syncedAt);
                dt = (now - syncedAt)/1000;
                if (VERBOSE === true) console.log(dt)
                return (dt > config.ARCHIVE_DT);
            })
            .data();
        _.each(olds, function(resp){


            // Remove them from status table as well.
            item = obj.statusTable.find({'resourceId':resp.id})[0];
            obj.statusTable.remove(item);

            $fsResp.delete(resp.id);
        });
    };

    this.updateReadOnly = function(){
        if (VERBOSE === true) console.log("[sync.updateReadOnly()] ")
        appObj = obj._updateApp();
        var updateListener = $rootScope.$on('app-updated', function(event, args){
            // Reconcile app formstacks and collection formstacks here.
            
            var formstackSlugs; // The combined list of formstacks that need updating.
            var remoteFormstacks;

            var localFormstacks = $formstack.getSlugs();

            if (args.app.formstacks.length > 0 && args.app.formstacks[0].slug ) {
                remoteFormstacks =  _.map(args.app.formstacks, function(fs) {return fs.slug;});
            } else {
                remoteFormstacks = args.app.localFormstacks;
            }

            var newFormstacks = _.difference(remoteFormstacks, localFormstacks);
            var staleFormstacks = _.difference(localFormstacks, remoteFormstacks);


            formstackSlugs = localFormstacks.concat(newFormstacks);

            obj._updateFormstacks(formstackSlugs);
            updateListener();  // This destroys the listener
        });
    };

    this._updateApp = function(){
        /*
            Hits the un-nested app endpoint
            /api/v2/pfomrs/app/<app-id>/&modified_gte
        */
        var app = $vpApi.getApp();

        var entry;
        var entrys = obj.statusTable.find({'resourceId': app.id});


        if (entrys.length > 0){
            if (entrys.length > 1) {
                console.warn("[sync._updateApp] More than 1 entry found in statusTable for app " + app.slug + ". Using the first one.");
            }
            entry = entrys[0]
            entry = entrys[0];
            last_ts = entrys[0].lastAttempt;
            entry.entrys++;
            entry.status = "pending";
            entry.lastAttempt = $vpApi.getTimestamp();
            obj.statusTable.update(entry);
        } else {
            last_ts = new Date(2015 ,1,1).toISOString();
            entry = {
                "status": "pending",
                "entrys": 1,
                "lastAttempt": $vpApi.getTimestamp(),
                "method": "GET",
                "resourceUri": "/api/v2/pforms/app/" + app.id,
                "resourceId": app.id,
                "collection": "app" 
            }
            obj.statusTable.insert(entry);
        }
        $vpApi.db.save();
        success = function(data, status, slug){
                app = $vpApi.getApp();
                
                if (data === null){

                } else {
                    
                    if (VERBOSE === true) console.log("[sync._updateApp] app updated: " + app.slug);
                }
                // Update status table
                var attempt = obj.statusTable.find({'resourceId': app.id})[0];

                attempt.status = 'success';
                obj.statusTable.update(attempt);
                $vpApi.db.save();
                $rootScope.$broadcast("app-updated", {app:app});


        } // end success()
        error = function(data, status, slug){
            console.warn("sync.[_updateApp] update failed, status " + status);
            if (VERBOSE === true) console.log(data);
        } // end error()
        $app.updateBySlug(app.slug, last_ts, success, error);
    };// end _updateApp()

    this._updateFormstacks = function(formstackSlugs){
                
        _.each(formstackSlugs, function(fsSlug) {
            
            // Check status table for last formstack sync timestamp
            
            var attempt;
            var fs = $vpApi.db.getCollection('formstack').find({'slug':fsSlug})[0];
            success = function(data, status, slug){
                fs = $vpApi.db.getCollection('formstack').find({'slug':slug})[0];
                
                if (data === null){
                    if (VERBOSE === true) console.log("[sync._updateFormstacks] No updates found for " + slug);
                } else {
                    // Need to insert the updated formstack into $loki.
                    if (VERBOSE === true) console.log("[sync._updateFormstacks] formstack updated: " + fs.slug);
                };

                 // Update status table
                var attempts = obj.statusTable.find({'resourceId': fs.id});
                var attempt = {};    
                if (attempts.length === 1) {
                    attempt = attempts[0];
                    attempt.status = 'success';
                    obj.statusTable.update(attempt);
                } else if (attempts.length > 0){
                    console.warn("[sync._updateFormstacks()] Found more than 1 attempt record in the statusTable.");
                } else if (attempts.length === 0){
                    console.warn("[sync._updateFormstacks()] Could not find previous attempt.");
                }

                $vpApi.db.save();

            }
            error = function(data, status, slug){
                console.warn("[sync._updateFormstacks] update failed, status " + status);
                if (VERBOSE === true) console.log(data);
            }
            if (VERBOSE === true) console.log("[sync._updateFormstacks] Checking for updates to formstack " + fs.slug);
            var attempts = obj.statusTable.find({'resourceId': fs.id});

            if (attempts.length === 1){
                attempt = attempts[0];
                last_ts = attempts[0].lastAttempt;
                attempt.attempts++;
                attempt.status = "pending";
                attempt.lastAttempt = $vpApi.getTimestamp();
                obj.statusTable.update(attempt);
            } else if (attempts.length === 0) {
                last_ts = new Date(2015 ,1,1).toISOString();
                attempt = {
                    "status": "pending",
                    "attempts": 1,
                    "lastAttempt": $vpApi.getTimestamp(),
                    "method": "GET",
                    "resourceUri": "/api/v2/pforms/formstack/" + fs.id,
                    "resourceId": fs.id,
                }
                obj.statusTable.insert(attempt);
            } else {
                console.warn("[sync._updateFormstacks] More than one previous attempt found before checking for updates.");
            }

            $vpApi.db.save();
            $formstack.updateBySlug(fs.slug, last_ts, success, error);
        });
    }; // end _updateFormstacks()

    saveListenerHandler = function(){
        /*
        We probably won't use this. Wil 2015-03-10
        */
        obj.saveListener(); // This should remove it
        var onSucess = function(data, status){
            if (VERBOSE === true) console.log("[db.save] Success")
        }
        var onError = function(data, status){
            if (VERBOSE === true) console.log("[db.save] Fail")

        }

        var resps = angular.copy($vpApi.db.getCollection('fsResp').data);
        obj.pushFsResps(resps, onSucess, onError);

        // Remove the listener for a liitle bit so we don't spam the server.
        
        $timeout(function() {
            if (VERBOSE === true) console.log("restarting db.save listener")
            obj.saveListener  = $rootScope.$on('db.save', saveListenerHandler);
        }, 1000);
    }
    obj.saveListener  = $rootScope.$on('db.save', saveListenerHandler);
}]);