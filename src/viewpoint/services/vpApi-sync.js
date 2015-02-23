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
                    '$ionicLoading',
            function($rootScope, 
                     $http, 
                     config, 
                     $vpApi,
                     $app,
                     $formstack, 
                     $fsResp,
                     $ionicLoading
                     ) {

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

        */

        if (window.HAS_CONNECTION !== true || !$vpApi.user) {
            console.warn("No network found, sync cancelled.")
            return;
        }

        onSucess = function(data, status) {
            console.log('[$sync.run.OnSucess]');
            $rootScope.$broadcast('sync-complete', data);
            callback(data, status);

            
        };

        onError = function(data, status) {
            console.log('[$sync.run.OnError]');
            //$ionicLoading.show({ template: 'There was a problem syncing some responses.', noBackdrop: true, duration: obj.toastDuration });
        };

        // Get formstack responses and then submit them
        var submitted = angular.copy($vpApi.db.getCollection('fsResp').find({'status':'submitted'}));
        if (submitted.length === 0) onSucess([], 'There are no submitted formstack to sync.');
        this.submitFormstacks(submitted, onSucess, onError);


        // Remove any old synced responses
        obj.clearSyncedFormstacks();

        // Update readonly resources
        obj.updateReadOnly();
        $rootScope.$broadcast('sync-complete');

    };

    this.submitFormstacks = function(resps, onSucess, onError) {
        /*

        This function POST's the formstack respoinses to the
        /pforms/formstack/<ID>/submit endpoint.

        */

        var fsFullResp; // This will be the full nested formstack response.
        var fsResp;
        var count = 0;
        var resource;

        submitSuccess = function(data, status){
            console.log('Submit successful: ' + data.id);
            console.log(data);


            // Update statusTable
            item = obj.statusTable.find({'resourceId':data.id})[0];
            item.status = 'success';

            // Update record's status
            fsResp = $vpApi.db.getCollection('fsResp').find({"id":data.id})[0];
            fsResp.status = 'synced';
            fsResp.syncedAt = $vpApi.getTimestamp();

            $vpApi.db.save();
            count++
            if (count === resps.length) {
                // This is the last response.
                onSucess([1,2], 'Finished submitting formstacks.');
            }
        }

        submitFail = function(data, status){
            console.log('I failed ' + status);

            // Update statusTable
            item = obj.statusTable.find({'resourceId':data.id});
            item.status = 'fail';
            $vpApi.db.save();

            count++
            if (count === resps.length) {
                // This is the last response.
                onSucess({}, 'Finished submitting formstacks.');
            }
        }

        _.each(resps, function( resp ){
            fsFullResp = $fsResp.getFullResp(resp.$loki);

            resource = "pforms/formstack/"+fsFullResp.fsId+"/submit";
            console.log("About to post to " + resource);

            // Update status table
            item = obj.statusTable.find({'resourceId':resp.id});

            if (item.length === 0) {
                // This must be a new attempt
                item = {
                    "status": "pending",
                    "attempts": 1,
                    "lastAttempt": $vpApi.getTimestamp(),
                    "method": "POST",
                    "resourceUri": resource,
                    "resourceId": resp.id
                }

                obj.statusTable.insert(item);
            } else {
                item.status = 'pending';
                item.attempts++;
                item.lastAttempt = $vpApi.getTimestamp();
                obj.statusTable.update(item);
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
                console.log(dt)
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
        // TODO Make this happen
        console.log("I NEED TO UPDATE MEDIA AND TILES???");
        appObj = obj._updateApp();

        
        var updateListener = $rootScope.$on('app-updated', function(event, args){
            console.log("in app-updated listener");

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

            console.log("newFormstacks");
            console.table(newFormstacks);

            console.log("staleFormstacks");
            console.table(staleFormstacks);

            formstackSlugs = localFormstacks.concat(newFormstacks);
            console.log("formstack slugs to update: ");
            console.table(formstackSlugs);

            obj._updateFormstacks(formstackSlugs);
            updateListener();  // This destroys the listener?
        });
    };

    this._updateApp = function(){
        /*
            Hits the un-nested app endpoint
            /api/v2/pfomrs/app/<app-id>/&modified_gte
        */
        var app = $vpApi.getApp();

        var entry;
        console.log("Checking for app updates " + app.slug);
        var entrys = obj.statusTable.chain()
            .find({'resourceId': app.id})
            .find({'method':'GET'})
            .find({'status':'success'})
            .simplesort({'lastAttempt': 'asc'})
            .data();

        if (entrys.length > 1) {
            console.error("[sync._updateApp] More than 1 entry found in statusTable for app "  )
        } else if (entrys.length === 1){
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
            }
            obj.statusTable.insert(entry);
        }
        $vpApi.db.save();
        success = function(data, status, slug){
                app = $vpApi.getApp();
                
                if (data === null){
                    console.log("[_updateApp] No updates found");
                } else {
                    // Need to insert the updated formstack into $loki.
                    console.log("[_updateApp] app updated: " + app.slug);
                }
                // Update status table
                var attempt = obj.statusTable.chain()
                    .find({'resourceId': app.id})
                    .find({'method':'GET'})
                    .find({'status':'pending'})
                    .simplesort({'lastAttempt': 'asc'})
                    .data()[0];

                attempt.status = 'success';
                obj.statusTable.update(attempt);
                $vpApi.db.save();
                $rootScope.$broadcast("app-updated", {app:app});


        } // end success()
        error = function(data, status, slug){
            console.warn("[_updateApp] update failed, status " + status);
            console.log(data);
        } // end error()
        console.log("Checking for updates to app " + app.slug);
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
                    console.log("[updateReadOnly] No updates found");
                } else {
                    // Need to insert the updated formstack into $loki.
                    console.log("[updateReadOnly] formstack updated: " + fs.slug);
                };

                 // Update status table
                var attempts = obj.statusTable.chain()
                    .find({'resourceId': fs.id})
                    .find({'method':'GET'})
                    .find({'status':'pending'})
                    .simplesort({'lastAttempt': 'asc'})
                    .data();

                var attempt = {};    
                if (attempts.length === 1) {
                    attempt = attempts[0];
                    attempt.status = 'success';
                    obj.statusTable.update(attempt);
                } else if (attempts.length > 0){
                    console.warn("[sync._updateFormstacks()] Found more than 1 attempt record in the statusTable.");
                }

                $vpApi.db.save();

            }
            error = function(data, status, slug){
                console.warn("[updateReadOnly] update failed, status " + status);
                console.log(data);
            }
            console.log("Checking for updates to formstack " + fs.slug);
            var attempts = obj.statusTable.chain()
                .find({'resourceId': fs.id})
                .find({'method':'GET'})
                .find({'status':'success'})
                .simplesort({'lastAttempt': 'asc'})
                .data();

            if (attempts.length > 0){
                attempt = attempts[0];
                last_ts = attempts[0].lastAttempt;
                attempt.attempts++;
                attempt.status = "pending";
                attempt.lastAttempt = $vpApi.getTimestamp();
                obj.statusTable.update(attempt);
            } else {
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
            }
            $vpApi.db.save();

            $formstack.updateBySlug(fs.slug, last_ts, success, error);
        });
    }; // end _updateFormstacks()
}]);