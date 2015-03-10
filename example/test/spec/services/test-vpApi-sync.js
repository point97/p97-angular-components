"use strict";

window.HAS_CONNECTION = true;
window.DB = function(dbFilename){
    var obj = this;
    this.db;
    this.user;
    this.users;
    this.dbFilename = dbFilename
    
    this.loadHandler = function(){

        obj.db.save()
        obj.users = obj.db.getCollection('user');
        
        if (obj.users && obj.users.data.length > 0 && obj.users.data[0].username){
            obj.user = obj.users.data[0];
        } else {
            obj._createDb();
        }
    };


    this._createDb = function(){
        /* 
        Creates the database and adds all the collections needed
        then saves to local storage. 
        */
        
        var collections = ['user','app', 'formstack', 'fsResp', 'formResp',
                           'blockResp', 'answer', 'media', 'statusTable'];
        var col;
        _.each(collections, function(colName){
            col = obj.db.addCollection(colName);
            col.setChangesApi(true);
            col.on('pre-insert', function(item){
                item.id = obj.generateUUID();
            });

        });
        var user = {user:"testuser1", "token":"b8a8704f63eaa84f221a7242716a1fc612de06ca"};
        obj.user = obj.db.getCollection('user').insert(user);

        obj.db.save();
    }

    //this.idbAdapter = new lokiIndexedAdapter('vpsurvey');

    this.db = new loki(obj.dbFilename, { 
        //'adapter': obj.idbAdapter,
        //'autoload': true,
        //'autoloadCallback': obj.loadHandler
    });
    obj.loadHandler();
    return obj;
}

window.data = new DB('vpsurvey.json');




describe("vpApi sync service", function () {
    var sync, config, $vpApi, $app, timeout, httpBackend, data;

    beforeEach(module('vpApi.services'));
    
    beforeEach(module(function ($provide) {
        config = {};
        $provide.value('config', config);
        // $provide.value('')
    }));

    // Inject other services required by sync service.
    beforeEach(function() {
        inject(function($injector) {
            $vpApi = $injector.get('$vpApi');
            $app = $injector.get("$app");
            
        });
    });


    beforeEach(
        inject(function (_$sync_, $httpBackend, _$timeout_) {
            sync = _$sync_;
            timeout = _$timeout_;
            httpBackend = $httpBackend;
    }));


    it("Create a fsResp and checks the getFsResps function()", function () {

        var fsResp = {
            'fsId': 1,
            'fsSlug':'test-formstack',
            'cupdate': $vpApi.getTimestamp(),
            'ccreated': $vpApi.getTimestamp(),
            'status': 'in-progress',
        };

        var app = {
                id: 1,
                name: "Test App",
                slug:"test-app",
                formstacks: []
            };

        var fsResps = $vpApi.db.getCollection('fsResp');
        var numFsResps = 4;
        
        for(var i=0;i<numFsResps; i++){
            var newResp = angular.copy(fsResp);
            var entry = $vpApi.db.getCollection('fsResp').insert(newResp);
        }
        $vpApi.db.save();

        expect(fsResps.data.length).toEqual(numFsResps);
        console.log(fsResps.data[0].id);
        
        var resps2send = sync.getFsResps();


        // timeout(function(){
        //     console.log("In timeout")
        //     var resps2send = sync.getFsResps();
        //     expect(resps2send.length).toEqual(numFsResps);
        // }, 1000);
        // timeout.flush(999)
        // timeout.flush(1)


    });


    it("Create a fsResp and run sync.run().", function () {

        var fsResp = {
            'fsId': 1,
            'fsSlug':'test-formstack',
            'cupdate': $vpApi.getTimestamp(),
            'ccreated': $vpApi.getTimestamp(),
            'status': 'in-progress',
        };


        var app = {
                id: 1,
                name: "Test App",
                slug:"test-app",
                formstacks: []
            };

        // **************** The requests to make. ****************
        // Order matters here and all requests must be made.
        httpBackend.expectGET('undefinedpforms/get/app/?slug=short-test-app').respond(200, [app]);

        //httpBackend.expectGET(/modified_gte/).respond(200, {});
        //var submitReq = httpBackend.expectPOST('undefinedpforms/formstack/1/submit/', data);
        
        

        // var submitReq2 = httpBackend.expectPOST('undefinedpforms/formstack/1/submit/', data);
        // httpBackend.expectGET(/modified_gte/).respond(200, {});
        // *************** End expected request *********************

        var entry = $vpApi.db.getCollection('fsResp').insert(fsResp);
        
        var success = function(data, res){
            sync.run(function(){
                var statusTable = $vpApi.db.getCollection('statusTable').find({'resourceId':entry.id});
                expect(statusTable.length).toEqual(1);
                expect(statusTable[0].status).toEqual('success');

                // sync.run(function(){
                //     console.log("Second sync.run.autoloadCallback()");
                //     var statusTable = $vpApi.db.getCollection('statusTable').find({'resourceId':entry.id});
                //     expect(statusTable.length).toEqual(1);
                //     expect(statusTable[0].status).toEqual('success');
                // });
            });
        };

        var fail = function(){
            console.log("Failed to fetch app");
        };

        
        // submitReq.respond(200, {
        //         id: entry.id,
        //         name: "Test App",
        //         slug:"test-app"
        // });

        // submitReq2.respond(200, {
        //         id: entry.id,
        //         name: "Test App",
        //         slug:"test-app"
        // });

        $app.fetchBySlug("short-test-app", success, fail);
        httpBackend.flush();

    });

});




