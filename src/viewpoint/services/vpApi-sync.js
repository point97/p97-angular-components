/*
    build timestamp: Sun Feb 01 2015 11:09:50 GMT-0800 (PST)
    build source: vp-survey
*/
angular.module('vpApi.services')

.service( '$sync', ['$rootScope', 
                    '$http', 
                    'config', 
                    '$vpApi', 
                    '$fsResp',
                    '$ionicLoading',
            function($rootScope, 
                     $http, 
                     config, 
                     $vpApi, 
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

        if (window.HAS_CONNECTION !== true) {
            console.warn("No network found, sync cancelled.")
            return;
        }

        onSucess = function(data, status) {
            console.log('[$sync.run.OnSucess]');
            $rootScope.$broadcast('sync-complete', data);
            callback(data, status);

            //if (data.length > 0) {
            //    $ionicLoading.show({ template: 'All responses successfully synced.',
            //                     noBackdrop: true,
            //                     duration: obj.toastDuration
            //                    });
            //}

            
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
        
    }

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
        console.log("I NEED TO UPDATE FORMSTACKS AND MEDIA AND TILES???");

    }


}]);