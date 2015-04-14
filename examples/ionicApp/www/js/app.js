// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.controllers' is found in controllers.js

var BASE_TEMPLATE_URL = 'js/p97-components/src/viewpoint/question-types/';
var TEMPLATE_THEME = 'ionic';
var platform = 'hybrid';
var API_SERVER = "http://localhost:8000";
var API_BASE_URI = API_SERVER + '/api/v2/';

angular.module('starter', ['ionic', 'starter.controllers', 'p97.questionTypes', 'survey.services', 'vpApi.services', 'cache.services'])

.run(function($ionicPlatform) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if(window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }
    if(window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleDefault();
    }
  });
})

.constant('config', {
  // Put app wide constant here. 
  //'appName': 'Viewpoint Survey App',
  'supportEmail': 'support@point97.io',
  'apiServer': API_SERVER,
  'apiBaseUri': API_BASE_URI, //'http://localhost:8000/api/v2/', 'http://vp-staging.point97.io/api/v2/'
  'dbFilename':'vpsurvey.json',
  'stayLoggedIn': true,
  'version': '1.03.31a',
  'autoSyncing': false, // Wether or not to start the syncing task
  'SYNC_DT': 15*1000, // In seconds
  'ARCHIVE_DT': 60*60*24 // Time to keep synced formstacks around in seconds

})

.config(function($stateProvider, $urlRouterProvider) {
  $stateProvider

    .state('app', {
      url: "/app",
      abstract: true,
      templateUrl: "templates/menu.html"
    })

    .state('app.home', {
      url: "/home",
      views: {
        'menuContent' :{
          templateUrl: "templates/home.html",
          controller: 'HomeCtrl'
        }
      }
    });
  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/app/home');
});

