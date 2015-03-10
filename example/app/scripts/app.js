'use strict';

var BASE_TEMPLATE_URL = 'scripts/p97-components/src/viewpoint/question-types/';
var TEMPLATE_THEME = 'ionic';

/**
 * @ngdoc overview
 * @name exampleApp
 * @description
 * # exampleApp
 *
 * Main module of the application.
 */


var API_SERVER = "http://vp-dev.point97.io";
var API_BASE_URI = API_SERVER + '/api/v2/';

angular
  .module('exampleApp', ['p97.questionTypes'])

  .constant('config', {
  // Put app wide constant here. 
  //'appName': 'Viewpoint Survey App',
  'supportEmail': 'support@point97.io',
  'apiServer': API_SERVER,
  'apiBaseUri': API_BASE_URI, //'http://localhost:8000/api/v2/', 'http://vp-staging.point97.io/api/v2/'
  'dbFilename':'vpsurvey.json',
  'stayLoggedIn': true,
  'version': '1.03.05b',
  'autoSyncing': true, // Wether or not to start the syncing task
  'SYNC_DT': 15*1000, // In seconds
  'ARCHIVE_DT': 60*60*24 // Time to keep synced formstacks around in seconds

})
