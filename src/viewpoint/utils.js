String.prototype.trim = function(){
  return this.replace(/^\s+|\s+$/g, "");
};

String.prototype.toDash = function(){
  var out = this[0].toLowerCase() + this.substring(1);
  return out.replace(/([A-Z])/g, function($1){return "-"+$1.toLowerCase();});

};

String.prototype.toCamel = function(){
  return this.replace(/(\-[a-z])/g, function($1){return $1.toUpperCase().replace('-','');});
};



window.isLoggedIn = function($state, $vpApi){
    var user =$vpApi.user;
    if (user && user.token !== undefined) {
        $state.go('home');
    } else {
        return;
    }
}


window.hasToken = function($location, $vpApi){
    /*
    This checks to see it the user has a token. Probably
    need a better place for this.
    */

    //var raw = localStorage.getItem('user');
    //var user = JSON.parse(raw) || false;
    var user =$vpApi.user;
    // try {

    // } catch(e) {
    //   console.log("Cold not find local user object.")
    //   $location.path("/app/login");
    //   return;
    // }

    if (user && user.token !== undefined) {
        return;
    } else {
        $location.path("/login");
        return;
    }
}



// Load Loki database here.
// Makes the loki database available at $vpApi.db.
window.DB = function(dbFilename){
    var obj = this;
    this.db;
    this.user;
    this.users;
    this.dbFilename = dbFilename

    this.loadHandler = function(){
        console.log('[DB.loadHandler]');
        obj.users = obj.db.getCollection('user');
        if (obj.users && obj.users.data.length > 0 && obj.users.data[0].username){
            obj.user = obj.users.data[0];
        } else {
            console.log('[loadDatabase] Could not find users collection');
            obj._createDb();
        }
        console.log('[DB.loadHandler] About to bootstrap angular');
        angular.bootstrap(document, [ANGULAR_APPNAME]);
    };
    this._createDb = function(){
        /*
        Creates the database and adds all the collections needed
        then saves to local storage.
        */

        var collections = ['user','app', 'formstack', 'fsResp', 'formResp',
                           'blockResp', 'answer', 'media', 'statusTable', 'lastSavedUrl'];
        var col;
        _.each(collections, function(colName){
            console.log("[createDb] Creating table " + colName);
            col = obj.db.addCollection(colName);
            col.setChangesApi(true);
        });
        obj.db.save();
    }

    if (USE_INDEXED_DB === true){
        this.idbAdapter = new lokiIndexedAdapter(obj.dbFilename+'-adaptor');
        this.db = new loki(obj.dbFilename, {
            'adapter': obj.idbAdapter,
            'autoload': true,
            'autoloadCallback': obj.loadHandler
        });
    } else {
        this.db = new loki(obj.dbFilename, {
            'persistenceMethod': 'localStorage'
        });
    }
    return obj;
}; // End DB

