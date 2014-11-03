angular.module('vpApi.services', [])

.factory( '$vpApi', ['$http', function($http) {
  
  var user = {username:null,
              token:null,
              profile:null,
              };
  if (localStorage.getItem('token')) {
    user.token = localStorage.getItem('token');
  }
  var apiBase = API_BASE;
  //var apiBase = 'http://192.168.1.173:8000/api/v2/';


  function login(data, success_callback, error_callback) { 
    /*
    Inputs:
        data : object with keywords username, password
    */
    console.log('I should log in');
    var url = apiBase + 'authenticate/';
    user.username = data.username;
    
    
    // $http.defaults.headers.common.Authorization = 'Token ' + user.token;
    var config = {'Authorization':'Token ' + user.token};  
    $http.post(url, data, config)
      .success(function(data, status){
        user.token = data.token;
        localStorage.setItem('token', data.token);
        success_callback(data, status);
      })
      .error(function(data, status){
        error_callback(data, status)
    });
  }
  
  function logout() {

  }

  function fetch(resource, data, success, fail){
    var url = apiBase + resource + '/';
    var config = {headers: {'Authorization':'Token ' + user.token}};
    $http.get(url, config).success(function(data, status){
      success(data, status);
    })
    .error(function(data, status){
      fail(data, status);
    });
  }

  function post(resource, data, success, fail){
    var url = apiBase + resource + '/';
    var config = {headers: {'Authorization':'Token ' + user.token}};
    $http({url:url,
          method:'POST',
          data: data,
          headers: {'Authorization':'Token ' + user.token}
    }).success(function(data, status){
      success(data, status);
    })
    .error(function(data, status){
      fail(data, status);
    });
  }


  return {
      apiBase:apiBase,
      authenticate:login,
      user:user,
      fetch:fetch,
      post:post
  };
}])



.service('$formstack', ['$vpApi', '$localStorage', function($vpApi, $localStorage) {
  var obj = this;
  this.resource_name = 'pforms/formstack';
  this.objects = [];


  this.loadBySlug = function(slug, successCallback, errorCallback){
    /*
    Get the formstack from the VP2 server. 
    */
    if(HAS_CONNECTION){
      $vpApi.fetch(
        this.resource_name, 
        {'slug':slug}, 
        function(data, status){
          obj.objects = data;
          console.log("[loadBySlug] got data");
          $localStorage.setObject('formstack', data[0]);
          successCallback(data[0], status);

        },
        function(data, status){
          console.log("Failed to fetch " + obj.resource_name + ". Returned Status: " + status);
          console.log(data);
          errorCallback(data, status)
        }
      );

    }else{
      var formstack = $localStorage.getObject('formstack');
      obj.objects.push(formstack)
      successCallback(formstack,null)
    }

  };

  this.getBySlug = function(field, value){
    res = _.find(this.objects, function(obj){
      return (obj[field] === value);
    });
    return res || [];
  }

  this.fetchUpdates = function(slug, callback, errorCallback){
    /*
    Fetches update since last times stamp.

    TODO make this work, right now it just gets the formstack.
    */
    console.log("[fetchUpdates] getting data");

    this.loadBySlug(slug, callback, errorCallback);
  }

  this.getFormBySlug = function(slug){
    var form = _.find(this.objects[0].forms, function(obj){
      return (obj.slug === slug);
    });
    return form || [];
  }

    this.getBlocks = function(){
        out = [];
        _.each(this.objects[0].forms, function(form){
            out = out.concat(form.blocks);
        })
        return out;
    }

}])

.service('$form', ['$formstack', function($formstack) {
  var obj = this;
  var objects = [];

  this.getById = function(formId){
    res = _.find($formstack.objects[0].forms, function(obj){
      return (obj.id === formId);
    });
    return res;
  }

}])



.service('$block', ['$formstack', '$answers', function($formstack, $answers) {
    var obj = this;
    var objects = [];

    this.newItemIndex = function(block){
        // grab the answers that belong to the block
        var answers = _.filter($answers.objects, function(ans){
            return (ans.block === block.id);
        });

        var index = 0;
        if (answers.length > 0){
            var blockResponses = _.map(answers, function(ans){
                return ans.blockResponse;
            });
            blockResponses = _.unique(blockResponses);
            index = blockResponses.length;
        }
        return index;
    }


}])

.service('$formResponse', ['$localStorage', '$formstack', '$rootScope', '$answers', function($localStorage, $formstack, $rootScope, $answers){
    var obj = this;
    this.resource_name = 'pforms/response';
    this.objects =[];

    this.load = function(){
        /*
        Loads answers from local storage in this.objects
        */
        
        var formResponses = $localStorage.getObject('formResponses');
        this.objects = formResponses.objects || [];
    }

    this.getOrCreate = function(formSlug, formResponse){
        /*
        Get or create a form object. 

        Params:
        - formSlug: The sluf og the form you are creating.
        - formResponse - the form instance unique identifyer. This becomes the formResponse cid.
        
        Returns a formResponse object
        */

        var res = _.find(obj.objects, function(response){
            return response.cid === formResponse;
        });

        if (!res) {
            var cid = formResponse;
            var cupdate = new Date().toISOString(); // Client update timestamp
            
            res = {
              'formSlug':formSlug,
              'cid':cid,
              'cupdate': cupdate
            }
            this.objects.push(res);
            $localStorage.setObject('formResponses', this.objects);
        }
        return res;
    }

    $rootScope.$on('answer-created', function(event, data){
        obj.getOrCreate(data.formSlug, data.formResponse);
    })

    this.getByFormSlug = function(slug){
        var res = _.filter(obj.objects, function(response){
            return response.formSlug === slug;
        });

        return res || [];
    }

    this.getByCid = function(cid){
        return _.find(obj.objects, function(res){
            return (res.cid === cid);
        });
    }


    this.getBlockResponses = function(res){
        /*
        
        Returns object
        
        {
            "block_id": ,
            "blockResponse",
        }

        */

        var out = [];
        var blocks = $formstack.getBlocks();

        _.each(blocks, function(block){
            var answers = $answers.getByBlockId(block.id);
            // Loop over answers and return 
            var blockResponses = _.map(answers,function(ans){return ans.blockResponse;});
            blockResponses = _.unique(blockResponses);
            out.push({block:block.id, blockResponses:blockResponses});
        });
        return out
    }

}])

.service('$blockResponse', ['$localStorage', '$formstack', '$block', '$rootScope', '$answers', '$formResponse', function($localStorage, $formstack, $block, $rootScope, $answers, $formResponse){
    var obj = this;
    // this.resource_name = 'pforms/response'; This is currently client side only
    this.objects =[];

    this.load = function(){
        /*
        Loads block Responses from local storage into this.objects
        */
        
        var blockResponses = $localStorage.getObject('blockResponses');
        this.objects = blockResponses.objects || [];
    }


    this.getOrCreate = function(formSlug, formResponse, answer){
        /*
        Get or create a block Response object. 

        Params:
        - formSlug: The slug og the form you are creating.
        - formResponse - the form instance unique identifyer. This becomes the formResponse cid.
        - blockId - the block ID
        - blockResponse - the block instance

        Returns a blockResponse object
        */

        var res = _.find(obj.objects, function(response){
            return response.cid === answer.blockResponse;
        });

        if (!res) {
            var cid = answer.blockResponse;
            var cupdate = new Date().toISOString(); // Client update timestamp
            
            res = {
              'block':answer.block,
              'blockName':answer.blockName,
              'formSlug':formSlug,
              'formResponse':formResponse,
              'cid':cid,
              'cupdate': cupdate
            }
            this.objects.push(res);
            $localStorage.setObject('blockResponses', this.objects);
        }
        return res;
    }

    $rootScope.$on('answer-created', function(event, data){
        obj.getOrCreate(data.formSlug, data.formResponse, data);
    })


    this.getResponseIndex = function(cid){
        /*
        
        Returns -1 if it is a new block response.
        Returns a 0-based index is it is a valid block response
        Returns undefined else.
        */
        if (cid === 'new-block') return -1;

        var blockResponse = _.find(obj.objects, function(res){
            return res.cid === cid;
        });


        // Filters objects to only have responses from this block
        responses = this.getByFormAndBlock(blockResponse.formResponse, blockResponse.block) 

        if (blockResponse) {
            out =  _.indexOf(responses, blockResponse);
            return out;
        } else {
            return undefined;
        }
    }
    this.getByFormResponse = function(formResponseCid){
        /*
            Returns a list of objects, each object is a blockResponse.
        */

        var blockResponses = _.filter(obj.objects, function(res){
            return (res.formResponse === formResponseCid);
        })
        return blockResponses;
    }


    this.getByFormAndBlock = function(formResponseCid, block){
        var blockId;

        if (typeof(block) === 'number'){
            blockId = block;
        } else {
            blockId = block.id;
        }
        var blockResponses = _.filter(obj.objects, function(res){
            return (res.block === blockId && res.formResponse === formResponseCid)
        })
        return blockResponses;
    }

    this.prev = function(cid){
        /*
        Return the previous block Response id or null is it doesn't exist.
        */
        var out = null;
        var blockResponse = _.find(obj.objects, function(res){
            return res.cid === cid;
        });

        if (blockResponse){
            var index = _.indexOf(obj.objects, blockResponse);
            if (index > 0) {
                out = obj.objects[index-1].cid;
            }
        } 
        return out;
    };

    this.next = function(cid){
        /*
        Return the previous block Response id or null is it doesn't exist.
        */
        var out = null;
        var blockResponse = _.find(obj.objects, function(res){
            return res.cid === cid;
        });

        if (blockResponse){
            var index = _.indexOf(obj.objects, blockResponse);
            if (index < obj.objects.length-1) {
                out = obj.objects[index+1].cid;
            }
        } 
        return out;
    };

    this.getByBlockIndex = function(formResponseCid, blockIndex){
        /*
        

        Returns the responses from for a block on a given form response

        If there is not a previuos block, returns undefined
        */

        var out = [];
        var formResponse = $formResponse.getByCid(formResponseCid);
        if (formResponse){
            var form = $formstack.getFormBySlug(formResponse.formSlug);
            var block = form.blocks[blockIndex];
            
            if (block){
                res = _.filter(obj.objects, function(item){
                    return (item.block === block.id && item.formResponse === formResponse.cid)
                })
            }
            
            out = res;
        }
        return out;
        

    }


}])



.service( '$answers', ['$localStorage', '$form', '$rootScope', '$filter', '$vpApi', 'config',  
               function($localStorage, $form, $rootScope, $filter, $vpApi, config) {
  var obj = this;
  this.objects = [];
  this.resource_name = "pforms/answer";


  this.load = function(){
    /*
    Loads answers from local storage in this.objects
    */
    var answers = $localStorage.getObject('answers');
    this.objects = answers.objects || [];
  };

  this.fetchUpdates = function(callback){
    /*
    Fetch answers from the server based on username and formstackSlug.

    Stores answer on this.objects and in local storage.
    */

    data = {
        'response__formstack':config.formstackSlug,
        'response__owner__username':$vpApi.username
    }
    $vpApi.fetch(this.resource_name, data, function(data, status){
    
        // Loop through answers and add cid's
        _.each(data, function(ans){
            if (!ans.cid){
                ans.cid = 'answer_' + $filter("date")(Date.now(), 'yyyyMMddhhmmss.sss');
            }
        });
        obj.objects = data;
        $localStorage.setObject('answers', data);
        callback(data, status);

    },
    function(data, status){
      console.log("Failed to fetch " + obj.resource_name + ". Returned Status: " + status);
      console.log(data);
    });
  };

    this.getByCid = function(cid){
        answer = _.find(this.objects, function(obj){
            return(obj.cid === cid);
        });
        return answer;
    }

    this.getByBlockId = function(blockId, blockResponse){
        var res;
        var out = _.filter(this.objects, function(item){
            if (blockResponse){
                res = (item.block === blockId && item.blockResponse === blockResponse);
            } else {
                res = (item.block === blockId);
            }
          return res;
        });
        return out;
    };

    this.getByFormId = function(formId){
        var out = [];
        var form = $form.getById(formId)
        
        out = _.filter(this.objects, function(ans){
            return (ans.form === formId);
        });
        return out;
        
    };

  this.create = function(form, formResponse, block, blockResponse, question, value){
    /*
    This will create a new answer entry with a new cid, and cupdate timestamp.
    It will store it in localStorage and add it to this.objects.
    */
    var cid = 'answer_' + $filter("date")(Date.now(), 'yyyyMMddhhmmss.sss');
    var cupdate = new Date().toISOString(); // Client update timestamp
    
    item = {
      'form': form.id,
      'formSlug': form.slug,
      'formResponse':formResponse,
      'block': block.id,
      'blockName': block.name,
      'blockResponse':blockResponse,
      'question':question.id,
      'questionSlug':question.slug,
      'data': {'value':value},
      'cid':cid,
      'cupdate': cupdate
    }

    this.objects.push(item);
    $localStorage.setObject('answers', this.objects);

    // Check if the formResponse exists, and create one if not.
    
    //var formResponse = $formResponse.getOrCreate(form.slug, formResponse);
    $rootScope.$broadcast('answer-created', item);

  }

  this.update = function(cid, value){
    /*
        This updates an answer in the local storage based on the cid.
    */
    answer = this.getByCid(cid);
    var index = _.indexOf(this.objects, answer);
    this.objects[index].data = {'value': value};
    this.objects[index].cupdate = new Date().toISOString();
    console.log("[$answer.update()] updating answer" );
    console.log(this.objects[index]);
    $localStorage.setObject('answers', this.objects);
  }



  function getById(cid){
    console.log("[$answer.getById]")
    res = _.find(this.objects, function(ans){
      return (ans['cid'] === cid);
    });
    return res || [];
  }


}])

.service( '$profile', ['$http', '$vpApi', function($http, $vpApi){
  var apiBase = API_BASE;
  var user = $vpApi.user;

  if (localStorage.getItem('profile')) {
    user.profile = JSON.parse(localStorage.getItem('profile'));
    $vpApi.user.profile = user.profile;
  }

  this.load = function(successCallback){
    var url = apiBase +'account/profile/?user__username=';
    var config = {headers: {'Authorization':'Token ' + user.token}};
    $http.get(url+user.username, config).success(function(data, status){
        console.log("[loadProfile] got data");
        $vpApi.user.profile = data[0];
        console.log(data[0]);
        localStorage.setItem('profile', JSON.stringify(data[0]));
        if(typeof(successCallback) == "function"){
          successCallback();
        }
    })
  }

  this.update = function(){

  }

}])

.factory('Question', ['$vpApi', function($vpApi){
  /*
    This is old and should be renemed to $question
  */
  var resource_name = 'pforms/question';
  var objects = [];

  function load(successCallback){
    $vpApi.fetch(resource_name, {}, function(data, status){
      objects = data;
      successCallback(data, status)
    },
    function(data, status){
      console.log("Failed to fetch " + resource_name + ". Returned Status: " + status);
      console.log(data);
    });
  }

  function create(data, callback) {
    $vpApi.post(resource_name, data, function(data, status){
      callback(data, status);
    }, function(data, status){
      console.log("Failed to create " + resource_name + ". Returned Status: " + status);
      console.log(data);
      callback(data, status);

    });
  };

  function getBySlug(field, value){
    res = _.find(objects, function(obj){
      return (obj[field] === value);
    });
    return res || [];
  }

  function cleanData(data){
    data.options = {'placeholder':''};
    data.type = parseInt(data.type);
    return data;
  }

  return {
    load:load,
    create:create,
    get:getBySlug,
    objects:objects,
    cleanData:cleanData
  };

}])

.factory('$localStorage', ['$window', function($window) {
  return {
    set: function(key, value) {
      $window.localStorage[key] = value;
    },
    get: function(key, defaultValue) {
      return $window.localStorage[key] || defaultValue;
    },
    setObject: function(key, value) {
      $window.localStorage[key] = JSON.stringify(value);
    },
    getObject: function(key) {
      return JSON.parse($window.localStorage[key] || '{}');
    }
  }
}]);


