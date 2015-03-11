/*
    build timestamp: Sun Feb 01 2015 11:09:50 GMT-0800 (PST)
    build source: vp-survey
*/
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
    
    Broasdcasts
    - sync-failed
    - sync-complete

    */
    var VERBOSE = true;  // Set to true to turn on console.logs.
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

        $timeout(function(){

            var fsResps; // Responses to submit
            if (window.HAS_CONNECTION !== true) {
                console.warn("[sync.run()] No network found, sync cancelled.");
                return;
            }

            if (!$vpApi.user) {
                console.warn("[sync.run()] No user found, sync cancelled.");
                return;
            }

            onSucess = function(data, status) {
                $rootScope.$broadcast('sync-complete', data);
                callback(data, status);
                $vpApi.db.clearChanges();
                
            };

            onError = function(data, status) {
                if (VERBOSE === true) console.log('[$sync.run.OnError]');
                //$ionicLoading.show({ template: 'There was a problem syncing some responses.', noBackdrop: true, duration: obj.toastDuration });
            };

            fsResps = obj.getFsResps();
            if (fsResps.length > 0) {
                obj.pushFsResps(fsResps, onSucess, onError);
            }

            // Remove any old synced responses
            obj.clearSyncedFormstacks();

            // Update readonly resources
            obj.updateReadOnly();
            $rootScope.$broadcast('sync-complete');


            }, 1000);
    };

    this.getFsResps = function(){
        // Get formstack responses and then submit them
        var changes = $vpApi.db.generateChangesNotification(['fsResp']);
        var fsResps = [];
        
        if (VERBOSE === true) console.log("[sync.run()] Changes: " + _.map(changes, function(item){if (VERBOSE === true) console.log(item);}) );
        
        if (changes.length > 0){
            fsResps = _.map(changes, function(change){
                if (VERBOSE === true) console.log("change.obj.id: ")
                if (VERBOSE === true) console.log(change.obj.id)
                if (!change.obj.id) return null;  // Insert operations have no ID. That is done after the insert.
                var fsRespObj = $vpApi.db.getCollection('fsResp').find({'id':change.obj.id});
                
                if (VERBOSE === true) console.log(fsRespObj);
                if (fsRespObj.length > 0){
                    return angular.copy(fsRespObj[0]);
                }
            });
        }
        fsResps = _.compact(fsResps);
        if (VERBOSE === true) console.log("[sync.run()] found "+fsResps.length+" fsResps that changed");
        
        // Get unsynced responses
        var resps = $vpApi.db.getCollection('statusTable').chain()
                        .find({"collection": "fsResp"})
                        .find({"status": "pending"})
                        .data();
        if (VERBOSE === true) console.log("[sync.run()] found "+resps.length+" 'pending' fsResps");
        fsResps = fsResps.concat(angular.copy(resps));

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
        var resource;
        var statusTable = $vpApi.db.getCollection('statusTable');

        submitSuccess = function(data, status){

            // Update statusTable
            item = statusTable.find({'resourceId':data.id})[0];
            item.status = 'success';

            fsResp = $vpApi.db.getCollection('fsResp').find({"id":data.id})[0];

            // Update record's status to synced to lock it if it was submitted.
            fsResp.status = (data.status === 'submitted')? 'synced': data.status;
            fsResp.syncedAt = $vpApi.getTimestamp();

            $vpApi.db.save();
            count++;
            successCount++;
            if (count === resps.length) {
                // This is the last response.
                if (VERBOSE === true) console.log("[sync.pushFsResps()] " + successCount +" successully sumbitted, "+ failCount + " failed.");
                onSucess([1,2], 'Finished submitting formstacks.');
            }
        }

        submitFail = function(data, status){
            if (VERBOSE === true) console.log('I failed ' + status);
            $rootScope.$broadcast('sync-failed', {data:data, status:status});
            // Update statusTable
            
            item = statusTable.find({'resourceId':data.id});
            item.status = 'fail';
            $vpApi.db.save();

            count++;
            failCount++;
            if (count === resps.length) {
                // This is the last response.
                onSucess({}, 'Finished submitting formstacks.');
            }
        }

        _.each(resps, function( resp ){
            fsFullResp = $fsResp.getFullResp(resp.$loki);
            resource = "pforms/formstack/"+fsFullResp.fsId+"/submit";
            
            // Update status table
            var statusTable = $vpApi.db.getCollection('statusTable');
            item = statusTable.find({'resourceId':resp.id});

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

            $fsResp.delete(resp.$loki);
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