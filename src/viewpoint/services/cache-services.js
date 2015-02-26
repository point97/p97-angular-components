
angular.module('cache.services', [])

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
                    if (q.options.geoFence && q.options.geoFence.url){
                        fnames.push(q.options.geoFence.url);
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