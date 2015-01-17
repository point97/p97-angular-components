/*
Github Repo: https://github.com/point97/p97-angular-components.git
Version: v15.01.15a

*/

angular.module('vpApi.services')

.service( '$sync', ['$rootScope', '$http', 'config', '$vpApi', function($rootScope, $http, config, $vpApi) {

    var obj = this;
    this.collections = ['fsResp', 'formResp', 'blockResp', 'answer'];
    this.lastUpdate = localStorage.getItem('lastUpdate');
    
    if (this.lastUpdate) {
        this.lastUpdate = new Date(this.lastUpdate);
    }

    this.run = function(callback){
        var res, fsResps, answers, changes;
        var index = 0;
        changes = obj.getChanges();
        if (changes.length === 0) {
            callback([{'status':'', 'data':'No changes found'}]);
            return;
        }


        errors = [];

        OnSucess = function(data, status) {
            console.log('[$sync.run.OnSucess]');
            if (index === changes.length-1) {
                callback(errors);
            } else {
                index++;
                obj.syncResponse(changes[index], OnSucess, OnError);
            }
            
            
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
        this.syncResponse(changes[index], OnSucess, OnError);

        
    };

    this.syncResponse = function(resp, onSucess, onError) {
        var method, reource;

        if (resp.operation === 'I') method = 'POST'
        if (resp.operation === 'U') method = 'PUT'
        if (resp.operation === 'D') method = 'DELETE'

        debugger
        if (resp.name === 'fsResp' || resp.name === 'formResp' || resp.name === 'blockResp') {
            resource = "pforms/response";
        } else if (resp.name === 'answer') {
            resource = 'pforms/answer';
        } else {
            console.error("[$sync.syncResponse()] Invalid resource name" + resp.name);
        }
        
        resp.obj.formstack = resp.obj.fsId;
        resp.obj.reporter = $vpApi.user.profile.user;
        resp.obj.org = $vpApi.user.profile.orgs[0].id;
        delete resp.obj.meta;
        $vpApi.post(resource, resp.obj, onSucess, onError);
    };

    this.run2 = function(callback){
        var res, fsResps, answers, changes;
        
        changes = obj.getChanges();

        errors = [];

        // Sort into nested structure starting with fsResp --> formResp -->


        // First sync fsResp's
        fsResps = _.find(changes, function(item){return item.name === 'fsResp'});
        answers = _.find(changes, function(item){return item.name === 'answers'});

        fsOnSucess = function(data, status) {
            this.syncResponse()
        };

        fsOnError = function(data, status) {
            console.log('[fsOnError]')
        };

        this.syncResponse(fsResps.changes, fsOnSucess, fsOnError);

        callback(res);
    };

    this.syncResponse2 = function(changes, onSucess, onError) {
        /*
            Sync individual resources.

            Params:
            - resource: [String] the resrouceendpoint, e.g. pforms/response
            - changes: [Object] The loki changes output
        */
        var resource = 'pforms/response';
        var count = 0;
        _.each(changes, function(resp){
            if (resp.operation === 'I'){
                sucess = function(data, status){
                    onSucess(data, status);
                    count++;
                }

                fail = function(data, status){
                    console.error(status);
                    onError(data, status);
                    count++;
                }

                resource = "pforms/response";
                
                resp.obj.formstack = resp.obj.fsId;
                resp.obj.reporter = $vpApi.user.profile.user;
                resp.obj.org = $vpApi.user.profile.orgs[0].id;
                delete resp.obj.meta;
                debugger;
                $vpApi.post(resource, resp.obj, sucess, fail);
            }
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
