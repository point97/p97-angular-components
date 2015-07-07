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

        obj.db = window.data.db;
        // if (platform === 'web'){
        //     obj.db.save = function(){
        //         console.warn('[db.save()] indexedDB disabled. Broadcasting event: db.save')
        //         $rootScope.$broadcast("db.save");
        //     }
        // };

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

    if (window.data) this.dbinit();

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
                if (data.length === 0) console.error("[$profile.fetch() User profile not found.]");
                $vpApi.user.profile = data[0];
                $vpApi.users.update($vpApi.user);
                successCallback();
            }).error(function(data, status){
                errorCallback()
            });
    };

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
