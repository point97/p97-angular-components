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
                    '$timeout',
            function($rootScope, 
                     $http, 
                     config, 
                     $vpApi, 
                     $fsResp,
                     $timeout
                     ) {

    var obj = this;
    this.collections = ['fsResp', 'formResp', 'blockResp', 'answer'];
    this.lastUpdate = localStorage.getItem('lastUpdate');
    
    if (this.lastUpdate) {
        this.lastUpdate = new Date(this.lastUpdate);
    }

    this.run = function(callback){
        /*
        This function can be ran on a periodic timer or called by itself.

        It will look for submitted responses and send them to the server

        */
        var res, fsResps, answers, changes;
        var index = 0;
        var errors = [];


        OnSucess = function(data, status) {
            console.log('[$sync.run.OnSucess]');
            
            callback(data, status);
            
        };

        OnError = function(data, status) {
            console.log('[$sync.run.OnError]');
            if (index === changes.length-1) {
                callback(errors);
            } else {
                index++;
                errors.push({'status':status, 'data':data});
                obj.syncResponse(changes[index], OnSucess, OnError);
            }
        };

        var submitted = angular.copy($vpApi.db.getCollection('fsResp').find({'status':'submitted'}));
        if (submitted.length === 0) OnSucess({}, 'There are no submitted formstack to sync.');

        this.submitFormstacks(submitted, OnSucess, OnError);

        
    };

    this.submitFormstacks = function(resps, onSucess, onError) {
        var fsFullResp; // This will be the full nested formstack response.
        var fsResp;
        var count = 0;
        var failedAttempts = [];
        var resource;

        submitSuccess = function(data, status){
            console.log('Pretend success callback status ' + status);
            console.log(data);
            fsRespId = data.fsRespId;

            fsResp = $vpApi.db.getCollection('fsResp').find({"id":fsRespId})[0];
            fsResp.status = 'synced';
            $vpApi.db.save();
            count++
            if (count === resps.length) {
                // This is the last response.
                onSucess({}, 'Yeah I finished Pretending to submit formstacks. Aren\'t you proud of me?');
            }
        }

        submitFail = function(data, status){
            console.log('I failed ' + status);
            failedAttempts.push({"data":data, "status":status})
            count++
            if (count === resps.length) {
                // This is the last response.
                onSucess({}, 'Yeah I finished Pretending to submit formstacks. Aren\'t you proud of me?');
            }
        }


        _.each(resps, function( resp ){
            fsFullResp = $fsResp.getFullResp(resp.$loki);
            resource = "pforms/formstack/"+fsFullResp.fsId+"/submit";
            console.log('Pretending to sync ' + resp.$loki);

            // // $vpApi.post(resource, fsFullResp, onSucess, onError);
            // $timeout(function(){
            //     submitSucess(resp.$loki);
            // }, 2000);
            console.log("About to post to " + resource)
            $vpApi.post(resource, fsFullResp, submitSuccess, submitFail);
        });
        
    }


    this.getChanges = function(){
        /*
        Get the items that need to be uploaded to the server.

        Items include fsResp, formResp, blockResp, answer

        changes items will have keywords
        - name
        - operation: "I", "U", "D"
        - obj 

        */
        


        var changes;
        var out = [];
        changes = $vpApi.db.serializeChanges(obj.collections);
        return JSON.parse(changes);

        _.each(this.collections, function(colName){
            changes = $vpApi.db.serializeChanges([colName]);
            changes = JSON.parse(changes);
            console.log(colName);
            console.table(changes);
            out.push({'name':colName, 'changes':changes});
        });

        return out;
    };
}]);
