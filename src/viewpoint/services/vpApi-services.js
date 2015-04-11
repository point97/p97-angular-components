
angular.module('vpApi.services', [])

.service( '$vpApi', ['$rootScope', '$http', 'config', function($rootScope, $http, config) {
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
          console.log("get fail");
          fail(data, status);
        });
    }

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
    }

    this.showCollection = function(collectionName){
        console.log("SHOW TABLE: " + collectionName);
        console.table(data.db.getCollection(collectionName).data);
    }

    if (window.data) this.dbinit();

}])

.service('$user', ['$rootScope', '$vpApi', '$app', '$formstack', '$profile', function($rootScope, $vpApi, $app, $formstack, $profile){
    var obj = this;

    this.authenticatedCallback = function(event, args){
        $profile.fetch(function(){
            $vpApi.db.save(); // This is to save the profile to indexedDB.

            allowedApps = $vpApi.user.profile.allowed_apps;
            if (allowedApps.length > 0) {
                appSlug = allowedApps[0];
            } else {
                console.error("There are no allowed Apps for this user.");
                // TODO Handle the no formstack case.
            }

            // Now use the allowed_apps to get first app.
            $app.fetchBySlug(appSlug,
                function(data, status){
                    formstacks = data["formstacks"];
                    //Clear data
                    oldStacks = $vpApi.db.getCollection('formstack').find();
                    _.each(oldStacks, function(old){
                        $vpApi.db.getCollection('formstack').remove(old);
                    });
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
                    args.onSuccess();
                },
                function(data, status){
                    console.log('[$user] failed to fetch formstack');
                    console.log(data);
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
                    fs = data[0]
                }
                $rootScope.$broadcast('formstack-updated', slug);                 
                success(fs,status, slug);
            },
            function(data, status){
                obj._fetchFail(data, status, slug);
                error(data, status, slug);
            }
        );
    };

    this.getQuestionBySlug = function(slug) {
        var fs = $vpApi.db.getCollection('formstack').data[0];
        var out;
        _.find(fs.forms, function(form){
            blockRes = _.find(form.blocks, function(block){
                qRes = _.find(block.questions, function(q){
                    if (q.slug === slug){
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

    this.getChoice = function(qSlug, value){
        /*
            Get's a questions choice by question slug and value.
            Handles the 'other' answer case
        */
        var choice;
        var question = obj.getQuestionBySlug(qSlug);
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

    this.delete = function(fsRespId){
        /*
        DEPRACTED 3/3/2015 by WB, use delete2() instead. 


        A cascading delete for formResps, this will delete the children of the fsResp.
        
        */

        obj.objects = $vpApi.db.getCollection('fsResp');
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

    this.delete = function(formRespId){
        /*
        A cascading delete for formResps, this will delete the children of the formResp.

        */

        var formResp = $vpApi.db.getCollection('formResp').get(formRespId);
        if (formResp) {
            var blockResps = $vpApi.db.getCollection('blockResp').find({'formRespId': formRespId});
            var answers = $vpApi.db.getCollection('answer').find({'formRespId': formRespId});
        } else {
            console.warn("Form Response does not exist: " + formRespId);
            return;
        }

        // Remove the responses
        $vpApi.db.getCollection('formResp').remove(formResp);
        _.each(blockResps, function(resp){
            $vpApi.db.getCollection('blockResp').remove(resp);
        });

        _.each(answers, function(resp){
            $vpApi.db.getCollection('answer').remove(resp);
        });
        $vpApi.db.save();
    }
}])

.service('$blockResp', ['$vpApi', function($vpApi){
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

    this.delete = function(blockRespId){
        /*
        Deleting entire block responses

        */
        var blockResp = $vpApi.db.getCollection('blockResp').find({'id': blockRespId});
        // Remove the responses in block
        $vpApi.db.getCollection('blockResp').remove(blockResp);

        var answers = $vpApi.db.getCollection('answer').find({'blockRespId': blockRespId})


        _.each(answers, function(ans){
            $vpApi.db.getCollection('answer').remove(ans);
        });

        $vpApi.db.save();
    }


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
