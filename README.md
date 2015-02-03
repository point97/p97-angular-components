
# p97-components

A collection of angular component to be used with Viewpoint 2.

## Table of Contents 

* [1. Usage](#1-usage)
* [2. The Example App](#2-the-example-app) 
* [3. Authentication](#3-authentication)
* [4. Question Types](#4-question-types)
* [5. Apps and App Options](#5-apps-and-app-options)
* [6. Formstacks and Formstack Options](#6-formstacks-and-formstack-options)
* [7. Forms and Form Options](#7-forms-and-form-options)
* [8. Blocks and Block Options](#8-blocks-and-block-options)
* [9. Angular Services](#9-angular-services)
* [10. Linear Form and Block Controllers](#10-linear-form-and-block-controllers)
* [11. Viewpoint API Syncing](#11-viewpoint-api-syncing)
* [12. For Developers](#11-for-developers)
* [13. The Build Process](#12-the-build-process)
* [14. Testing](#13-testing)


##1. Usage

**Note:** This section describes how to use the components in your application. For instruction on how to develop components see [For Developers](#for-developers)

```
# Save to dependencies
bower install p97-components --save
```

This will install a directory named `p97-components` containing 
* services.js
* services.min.js
* question-types.js
* question-types.min.js
* templates/


Then add the files to your html. 
```
<script src="PATH_TO_JS_LIB/p97-components/dist/viewpoint/services.min.js"></script>
<script src="PATH_TO_JS_LIB/p97-components/dist/viewpoint/question-types.min.js"></script>

# Coming on v0.5
<script src="PATH_TO_JS_LIB/p97-components/dist/viewpoint/controllers.min.js"></script>
```

See the [Question Types](#3-question-types) section for a detailed list of the question types. 

---
##2. The Example App
There is an example application used for testing and a tutorial located in `examples/`

This example is build on Yeoman and it's Angular generator. See http://yeoman.io/codelab/setup.html for more info. You will need Ruby and Compass installed and up-to-date, and node and npm installed and up-to-date.

To run the example app
```
cd example/
npm install
grunt serve
```

### Troubleshooting
If you get a compass error try 


```
sudo gem update --system
sudo gem install sass
sudo gem install compass
```

You will need to symbolically link the `src/` directory to the example apps `scripts/p97-components/` directory. This allows you to edit the src files in one place.

```
cd example/app/scripts/
mkdir p97-components
cd p97-components
ln -s ../../../../src/ src
```

## 3. Authentication
Authentication is handle using the `$vpApi` service. 

Once a user is authentication there API token and account info will be stored in localStorage in a  `user` database.  This is used to check if a user has been autenticated. 

### 3.1 Check if the user is authenticated
In your router, you should add a resolve function to check if  `user.token` is present. If it is not you should redirect to a login page.  
```
.state('app.home', {
      url: "/home",
      views: {
        'menuContent' :{
          templateUrl: "templates/home.html",
          controller: 'HomeCtrl'
        }
      },
      resolve: {
        hasToken: function($localStorage, $location){
            var user = $localStorage.getObject('user');
            if( user && user.token ) return;
            
            $location.path("/app/login");
            return false;
        }
      }
    })
```

### 3.2 Authenticate a user
To log the user use the `$vpApi.authenticate(data, onSuccess, onError)` method, where data contains the keywords: `username`, `password`, `stayLoggedIn`.

```
# For example this could go in your login controller.

$vpApi.authenticate($scope.loginData, 
    function(data, status){
        $state.go('app.home');
        $ionicLoading.hide();
    },
    function(data, status){
        $scope.errorMsg = "Invalid username or password. Please try again.";
        $ionicLoading.hide();
    }
); // end authenticate

```
In the background this will
  1. Use the username and password to fetch the user's api token from Viewpoint. 

  1. Store the authenticated users token nad username in $vpApi.user, add it to the $vpApi.users collection in loki and then save the users collection to localStorage. 

  2. It will then broadcast an 'authenticated' event. 

  3. The `$user` service responsds to the 'authenticated' event by fetching the users profile and updating $vpApi.user and saving it to local storage.

  4. It then fetches the first formstack in $vpApi.user.profile.allowed_formstacks[0] and saves that to localStorage.



## 4. Question Types
Viewpoint 2 defines ?? different question types. See the Viewppoint API at /api/v2/formstack/question-type/ to see the list. Each question type has a corresponding directive. By default a question does not require an answer. To require an answer user `'require': true` in the options object. Defaults values are handled by the BlockCtlr not the question type directve. 

**Question Types default to ionic templates, unless otherwise specified. Ie. - if Yeoman templates are not included, it refers to ionic. This is particularly relevant in instances related to the `hideInput` function on each question - where Ionic's icons are not available in yeoman's view.

* **datetime** (only date component of datetime was added in v 0.3 - functional in v 0.4)
 PASSING TESTS - Looking at time datetime and Ionic UI stuff.

 `options`
 
  * templateUrl (yeoman templates currently unavailable): 
      * ionic/datetime.html
  * initial
  * min 
  * max
  * datejs_format: [String] e.g. 'MM/dd/yyyy HH:mm:ss'
  * required
  * default

* **number** - This can either be a decimal or an integer
  PASSING TESTS
  `options`
   * templateUrl (yeoman templates currently unavailable): 
      * ionic/number.html
  * min
  * max
  * required
  * default
 
* **textarea**
  PASSING TESTS 
  `min_word` and `max_word` take precedence over `min_char` and `max_char`
  
   `options`
 
  * min_word
  * max_word
  * min_char
  * max_char
  * show_word_count
  * show_char_count
  * required
  * default
  *   templateUrl : 
      * ionic/textarea.html
      * yeoman/textarea.html

* **yes-no** (deprecated in v 0.4 in favor of toggle)
  DEPRACTED 
  `options`
   
 * default: 'yes'

* **single-select**
PASSING TESTS 
The 'other' options allows for a user to enter a single text answer. Other validation is only Upper/lower case text, numbers, ., -, ' and a space. 

  `options`
  
  * templateUrl
     * "ionic/drop-down-single.html" 
     * "ionic/radio.html"
     * "ionic/checkbox-single.html" (looks like checkbox.html used for multi-select - however only a single choice can be made)
     * "yeoman/drop-down-single.html"
     * "yeoman/radio.html"
  * choices_from_previous_question: [String] the question slug to who's choices to use as choices for this question.
  * choices_from_previous_answer: [String] the question slug who's answers to use as choices for this question.  
  * required: [Boolean] defaults to `true`
  * allow_other: [Integer] 0 means no other field, if greater than 0, allows the user to enter freetyped answer.
  * other_max_length: [Integer] Then max length required by the other field, default to 250.  
  * default


* **multi-select**
IN PROGRESS but otherwise PASSING TESTS
 Don't have random order. 
 
  `options`

  * templateUrl 
     * "ionic/toggle-multi.html"
     * "ionic/checkbox.html"
     * "yeoman/drop-down-multi.html"
     * "yeoman/checkbox.html"
  * min_choice
  * max_choice
  * grouping
  * random_order
  * random_order_groups
  * choices_from_previous_question: [String] the question slug to who's choices to use as choices for this question.
  * choices_from_previous_answer: [String] the question slug who's answers to use as choices for this question.  
  * required
  * default

* **date** 
   PASSING TESTS
   `options`

   * templateUrl (yeoman templates currently unavailable): 
      * "ionic/date.html"
   * initial - currently only working when options.format = "yyyy"
   * min - if options.format is not "yyyy" - years must be input as a string "yyyy-mm-dd" (eg. "2015-04-23")
   * max - same requirements as min
   * required
   * default  
    * format: "yyyy" or blank (if blank or not "yyyy" - date defaults to using the native datepicker)
     * if "yyyy" is selected as a format - validates any year between 1900 and 2099
   

* **toggle**
PASSING TESTS
  Dispalys a toggle UI to the user. This automatically requires an answer and will default to default if nothing is provided. 

  `options`
  
  * positiveValue - [String]
  * positiveLabel - [String]
  * negativeValue - [String]
  * negativeLabel - [String] Not used.
  * default - [String]
  * templateUrl (specific to Ionic): 
      * "ionic/toggle.html"




* **integer**
PASSING TESTS
 This allows user to enter an integer, if you need a decimal input use question type `number`.
  `options`

  * min
  * max
  * required
  * default
  * templateUrl : 
      * "ionic/integer.html"
      * "yeoman/integer.html"

* **geojson**
  This question type collects geo spatial data as a GeoJson feature group. It displays a map that users can click toggle features on and off. 
  `options`
  * center: [Array] Coordinates to use for intial loading lat, lon 
  * zoom: [Integer] Inital zoom level, defaults to 10.
  * cache_tiles: [Boolean]
  * geojsonChoices: [Object]
    * - url: [String] URL to get the geojson Feature Group. Each feature in the group must have an `ID` on it's properites object. 
    * - style: [Object] A leaflet layer style object. See [Leaflet docs](http://leafletjs.com/reference.html).
  * maxSelectable: [Integer] USe this in conjuection with geojsonChoices. It determines the maximum number of feeatures that can be select. If not present or less then 1, it allows unlimited choices to be selected.
  * reuseChoice: [Boolean] If not present or true choices can be reused for on a repeating block. If false, the the choices gets disable and is unavailble to select if it has been selected on a previous block response.
  * require_in_bounds: [Boolean]
  * boundary_file: [String] name of boundary GeoJSON file to use (no path required).
  * use_planning_units: [Boolean]
  * planning_unit_file: [String] name of boundary GeoJSON file to use. (no path required)


### Available in version v0.6
* **email**
  PASSING TESTS - 
  `options`

  * required
  * default



* **time** 
 
  `options`
  
  * templateUrl: 
      * "ionic/time.html"
      * "ionic/popup.html"
      * "yeoman/time.html"
      * "yeoman/popup.html"
  * initial
  * min 
  * max
  * datejs_format: [String] e.g. 'HH:mm:ss'
  * required
  * default

* **checkbox**
  A single check box. 
  `options`
  * default: [String] 'checked', 'unchecked'
  * required

* **currency**
 
  `options`
  
  * min
  * max
  * code: [String] ISO 4217 currecny code e.g. 'USD', 'EUR'
  * required
  * default

* **phone-number**
  This will save a parsed array of the phone number, e.g. []. Need to worko n how to handled the cleaned_answer. 
  PASSING TESTS
  `options`

  * required
  * default
  *  format: "(xxx) xxx-xxxx"
    * "North America" (US territories, Canada, Bermuda, and 17 Caribbean nations)
    * "International" (Industry-standard notation specified by ITU-T E.123)


---

## 5. Apps and App Options  

---
## 6. Formstacks and Formstack Options

----
## 7. Forms and Form Options

The are two form types, the default, and a map form.

###7.1 Default Form

#### Options
* **skipWhen**: [Expression] A javascript expression that will be evaluted in the current $scope on the client. Exposes the following functions `getAnswer(SLUG)`.
  * Examples
      * "getAnswer('age').value > 18"
      * "getAnswer('activites').value.length > 0


* **forEachAnswer**: [String] A question slug, should be a multi-select (or a question type who’s answer.value is a array.) Uses items in the answer as formRepeatItem. For each map forms have an intro and end page.



###7.2 Map Forms
A map form consists of a map and a side panel. The side panel contains the question and survey naivigation controls. A map form only contains one block. The first question in the block is the *map question* and is where the map geojson is stored. The remaining questions will be presented to the user one at a time. 

Currently the map form can cache tiles. Tile caching regions and souceTiles should be defined on the first map form. Any other map from will use the same settings.

**URLS**

* /map-form/fsSlug/fsResp/formId#intro
  This view displays the initial form loading page. Its displays the HTML from `options.intro`.  The intro page is used to dispaly a navigation menu for formResps

* /map-form/fsSlug/fsResp/formId#end
  This page displays `options.end` HTML and as well as any repeat form buttons.

* /map-form/fsSlug/fsResp/formId#formRespId/new-blockId/qIndex
  This is a new block response to an existing form response.

* /map-form/fsSlug/fsResp/formId#formRespId/blockRespId/qIndex
  This is editing an existing block response to form response





###7.3 Foreach Forms
Forms that have `options.forEach` or `options.forEachAnswer` are considered foreach forms. When a forEach form is first encountered in the survey, the app will automatically create formResp's for all forEach items. If there are existing forEach form responses for items not in the forEach list, these form responses will be deleted.

Foreach forms have a `intro` page and and `end` page to help with navigating the multiple responses.

 **URLS** 
 
 * /form-foreach/fsSlug/fsRespId/formId/intro
  This view displays the initial form loading page. Its displays the HTML from `options.intro`.  The intro page is used to dispaly a navigation menu for formResps

 * /form-foreach/fsSlug/fsRespId/formId/end
   This page displays `options.end` HTML and FORWARD, BACK, REPEAT FORM, REPEAT BLOCK buttons.

* /form-foreach/fsSlug/fsRespId/formRespId/new-blockId
  This is a new block response to an existing forEach form response.

* /form-foreach/fsSlug/fsRespId/formRespId/blockRespId/
 This is editing an existing block response to a forEach form response



###7.4 All Form Options

* **skipWhen**: [Expression]

* **cacheTiles**: [Boolean] A flag to prompt the use to cache the tiles.

* **tileSources** [Array] A list of tile soruce obejcts.
  - verbose - The label that shows in the map controls
  - url - The url to use for fetching tiles, must contain {x}, {y}, {z}
  - attrib - The attribute to use.
  - storeName - The name to use for client side storage.

* **maxZoom** [Integer] The maximum allowed zoom level of the map. Note if this value is larger than maxCacheZoom tiles at the higher zoom levels will not show up when offline.

* **maxCacheZoom** [Integer] The maximum allowed zoom level used for tile caching. This differs from the maxZoom options in that it only effects the max zoom level that the tiles are cached for, the map may have a different max zoom level. Generally maxZoom should match maxCacheZoom. 

* **forEachAnswer**: [String] A question slug, should be a multi-select (or a question type who's answer.value is a array.) Uses items in the answer as formRepeatItem. For each map forms have an intro and end page.

* **intro**: [HMTL] An intro page
 
* **end**: [HMTL] An end page.

* **repeatable**: [Integer] The number of times to display the form can be answered. If <= 0 display it as many times as the user wants.

* **forEach**: [Array] **NOT IMPLEMENTED YET.** An array of expression that validates to an array. Uses items in the array as formRepeatItem.


Setting maxCacheZoom = 14, it took 17 minutes to cach 273MB with 36,000 GET requests. 

* **regions**: [Array] 

    ```
    [
        {
            name: "Region 1 - Coos Bay to OR/CA Border",
            nLat: 43.5,
            sLat: 42.0,
            wLng: -124.7,
            eLng: -124.2
        },
        {
            name: "Region 2 - OR/CA Border to Shelter Cove",
            nLat: 42.0,
            sLat: 40.0,
            wLng: -124.5,
            eLng: -123.8
        },
        {
            name: "Region 3 - Shelter Cove to Point Arena",
            nLat: 40.0,
            sLat: 32.0,
            wLng: -124.0,
            eLng: -123.5
        }
    ]
    ```

###7.4 Repeatable Forms


## 8. Blocks and Block Options

###8.1 Blocks

 **Options**


* **repeatable**: [Integer] The number of times to display the form repeat. If <= 0 display it as many times as the user wants. USes count as formRepeatItem.

* **forEach**: [Array] **NOT IMPLEMENTED YET.** An array of expression that validates to an array. Uses items in the array as formRepeatItem.

* **forEachAnswer**: [String] **NOT IMPLEMENTED YET.** A question slug, should be a multi-select (or a question type who's answer.value is a array.) Uses items in the answer as formRepeatItem.



##9. Angular Services

These are located in `dist/services.js`. This file contains to modules: `vpApi.services` and `survey.services`. To load these into your app inject `vpApi.services` and/or `survey.services` into your module. 


###vpApi.services

####$vpApi
Handles authentication and base HTTP requests, tile and media caching. These services are angular services so they are persistent across the entire app once the are loaded.

####$formstack
Resource: `/api/v2/pforms/formstack`
Handles fetching and updates from a read-only endpoint. 

####$form
Possibly deprecated in v0.5
####$block
Possibly deprecated in v0.5

####$formResponse
Handles creation of form responses with a `cid` as well as some getters.

####$blockResponse
Handles creation of block responses with a `cid` as well as some getters based on block response index.
####$answers
Handles fetching updates from API as well as creating and updating answers locally. 

####$profile

####$tilecache
A service to handle tile cahcing for map forms.

####$mediacache
A service to handle file cahcing for things like images and geojson files.


###survey.services

This is a singalton that contains logic that should be share across the Form and Block controllers.

---

##10. Linear Form and Block Controllers

The app URI structure should be as follows

`/app/<formstack-slug>/<formstack-response-uuid>/<form-response-uuid>/<block-response-uuid>/`

Examples
```
// For a brand new survey this would look like
`/app/my-survey/new/new-<form-slug>/new-<block-slug>`

// An existing survey answering a new page on an existing survey
`/app/my-survey/<formstack-repsponse-uuid>/<form-response-id>/new-<block-id>/`

// Editing an existing survey at a specific form and block
`/app/my-survey/<formstack-repsponse-uuid>/<form-response-uuid>/<block-response-uuid>/`

```

###10.1 LinearFormCtrl
This controller handles the loading of a **Formstack Response**, **Form**, **Form Response**, **Block**, **Block Response** and sets these varaibles on $scope.current (which is acessable in LinearBlockCtrl). It also broadcasts a 'saveBlock' event when the navigation buttons are pressed. 

#### Options


###10.3 LinearBlockCtrl

The BlockCtrl handles the loading a block and it's answers, saving of a block, and determines the state change when a 'saveBlock' event is recieved. This controller inherits it's scope from `LinearFormCtrl`, so anything defined on LinearFormCtrl.$scope is available here. 

####Skip Logic (Conditional Branching)
A block or form can be skipped with logic based on answers from a previous question

####Options
  * **skip_when**: A string to be evaluated in the survey.
    * "{{getAnswerTo('age')}} > 18"
    * "{{getAnswers('activites').length}}" > 0


---

## 11. Viewpoint API Syncing

### 11.1 The Algorithm(s)

Endpoint `/api/v2/pforms/formstack/<fsId>/submit`


The syncing algorithm will run a on timer every N seconds, with exponential back off if offline. Currenlty "syncing" occurs
at the Formstack level. That is a formstack is submitted in a nested format. On the client formstacks marked with a 
status of "submitted" will be synced. Once synced the status will flip to "synced".



To post to the `/api/v2/pforms/formstack/<fsId>/submit` endpoint the the nested formstack object must look like:

```
# sample formstack response
{
    "id": "716ca92d-bf94-4fb9-99a5-959f5604e5a9"
    "fsId": "17",
    "client_created": "2015-02-03T15:27:33.184Z",
    "client_updated": "2015-02-03T15:27:35.069Z",
    "formResps": [An Array of formResps objects ]
}

```

Where each **formResp** object looks like

```
# sample formResp
{
    "id": "16892a10-8005-4bcc-a34e-a7f17ba41fb8",
    "formId": 225,
    "formForEachItem": null,  # Not yet implemented
    "client_created": "2015-02-03T15:27:33.184Z",
    "client_updated": "2015-02-03T15:27:35.064Z",
    "blockResps": [An array of blockResp objects]]
}

```

Where each **blockResp** object looks like

```
# sample blockResp
{
    "id": "41f5f8d0-5050-4613-841d-d5ceef0dd46e",
    "blockId": 472,
    "blockForEachItem: null,
    "client_created": "2015-02-03T15:27:33.184Z",
    "client_updated": "2015-02-03T15:27:33.184Z",
    "answers": [An array of answer objects]
}

```

Where each **answer** object looks like

```
# sample answer
{
    "id: "104bef94-a229-4f04-ae09-794776edbce3"
    "questionId: 1215
    "value: The actual answer, could be a number, literal, or JSON object.
    "client_created: "2015-02-03T15:27:33.184Z"
    "client_updated: "2015-02-03T15:27:33.184Z"
}

```



The algorithm performs the following steps:



1. Check for network connectivity

2. Check Status table for pending tansactions. 
  * Transaction come from the $loki changes method.
  * The app syncs entire form formstacks

3. Send the list of changes for each formstack to the `/api/v2/pforms/sync/` endpoint.
  * On the server
    1. Compare the client changes list to servers changes list.
    2. Resolve any conflicts. HARD PART
    3. Merge changes into server
    4. Return the changes that the client must make
  * On Client
    1. Loop over returned changes and apply the changes.
    2. Updates status table ??? Not sure how to do this.

5. Update Read Only resrouces (.i.e. App, Formstack, mediacache)
  * Formstack is nested with Forms, Blocks, Questions, QuestionChoices. These will all be updated when the formstack updates
  * Update mediacache
  * Update tiles???

6. Update last updated timestamp

7. Broascast a 'sync-complete' event.


### 11.2 Status Table

Fields
* method: [String] 'GET", POST', 'PUT', 'DELETE', ''
* lastAttempt: [DateTime] Last syncing attempt timestamp
* attempts: [Integer] The number of times the resource has attempted to sync
* status: [String] 'pending'
* resourceId: [Integer] Client ID of the resource

### 11.3 Changes Object


---


## 12. For Developers

### Getting started
This assumes you have Node and NPM installed. See their pages on how to install. It is recommended to use Homebrew if you are using a Mac

1. cd into an appropriate directory and clone the repo `git@github.com:point97/p97-angular-components.git`

2. Change to the appropriate branch 

3. Install NPM packages.
    ```
    npm install
    ```

4. See [The Example App](#the-example-app) to get the example app up and running.

### 12.1 Making Question Type Components

There are several steps required to make a new question type directive but here is a breif outline.

1. Make a new directory named `src/viewpoint/question-types/<QUESTION-TYPE>/`. See the [directory structure below](#source-directory-structure).

2. Create your directive(s)  in `src/.../<QUESTION-TYPE>/directives.js` (Do the same for the controllers is needed).  You directive should be named with the question type slug. See the [Question Type Directive](#question-type-directives) section below for a description of the scope and methods the directive must have. 

3. Add templates to  `src/viewpoint/question-types/<QUESTION-TYPE>/templates/<THEME-NAME>/`. The THEME-NAME for vpMarket is **ionic**. There should always be a template named `<QUESTION-TYPE>.html` if additional templates are needed, you are free to name them how you want. 

4. Make sure you add your new question type to the `QUESTION_TYPES` array within the `gulpfile.js` file. 

5. Document the question type and all it's options in p97-angular-components README.md file (this document).

6. Add your question type to the example app to test it.

7. Write a Jasmine test for the directive. See the [Testing](#testing) section for this. 

8. Update the Viewpoint API to add the new question type and its default options.  

9. Build a new version, tag it and push the tag.  See [The Build Process](#the-build-process) for more info. 

#### Source Directory structure
```
src/
  - viewpoint/
    - services.js
    - question-types/
      - <QUESTION-TYPE>/
        - templates/
        - theme/
          - <QUESTION-TYPE>.html
          - other-template.html   
        - controllers.js
        - directives.js
```
Where `<QUESTION-TYPE>` is the slug of the question type.

---
### 12.2 Question Type Directives

All question type directives must accept `question` ,  `value`, and `form`  (this was previously named control) on their scopes. These varaibles will then be shared  between the parent controller's scope and the directive's scope.  Options for the questions will be defined. 
in `question.options`.

All directives must record their answers to the `scope.value`.  The answer maybe a number, string, or JSON object, depending on the question type.


#### Directive Scope
The scope takes three objects. 

```javascript
        // Scope should always look like this in all question types.
        scope: {
            question: '=', // question object coming from VP2 API
            value: '=', // The place where an anser is stored.
            form: '=' // An empty object where validation methods will be attached.
        },
```

 * **question** - This is a Viewpoint question object. Validation options are kept in `question.objects`
 
 * **value** - The actual raw value to record. This could be a string, a number, of a JSON object
 
 * **form** - A handle to attach methods to you want exposed in the parent controller.
 

### 12.3 Question Methods
Each question type directive will have the following methods available. These are attached to the `form` object passed into the directive and are then available to the parent controller.

```javascript
// This is available in the main controller.
scope.internalForm = scope.form || {};
scope.internalForm.validate_answer = function(){
  scope.errors = []; // A list of errors to display to the user
  // Define your directive's validation here.
  ...
  
  // Add any error messages to errors array.
  ...
  
  return is_valid;  // A boolean  
}


scope.internalControl.clean_answer = function(){
  // Defined any data cleaning here e.g. time formats.
  // You should do this before validating. 
  // Acts on scope.value
};
```

* **clean_answer(answer)**
Use this method to do any sort of pre-processing of data before passing it on to validate_answer(). For example hidden fields or computed fields that depend on related field's data. 

* **validate_answer(answer)**
  Returns: BOOLEAN
  This method takes the output of `clean_data()` and validates against the question options requirements. It returns the data is true, else it returns a list of validation errors to display on the UI. 

###12.4  Question Type Templates
Templates are grouped by themes. Themes usually depend on the front-end framework being used (e.g. Boostrap, Ionic, or Foundation) or platform being used, desktop vs. phonegap. 

Each directive must have a template name using the question type's slug. Templates should handle the displaying of all error messages. 


#### Dynamic Templates (v0.4 and up)
Dynamic templates allow allow survey author's and developer to change the html template used by a question type. This is useful for per directive level templates specification.

Templates should be organized in the following structure. The theme can be either `ionic` or `yeoman`. The default template location will be at `<QUESTION-TYPE>/templates/ionic/<QUESTION-TYPE>.html` Alternative templates should go in either and ionic or yeoman, with the name <ALTERNATIVE>. This should be specified on `question. options.templateUrl`

```
- question-types/
      - <QUESTION-TYPE>/
        - templates/
        - theme[ionic | yeoman]/
          - <QUESTION-TYPE>.html
          - <ALTERNATIVE>.html   
        - controllers.js
        - directives.js
```

Add the following keyword to the directive's `return` object. 
```
template: ''
```

Inside the directives link function you will need to define a function to get the template URL

```
scope.getContentUrl = function() {
                if(scope.question.options.templateUrl)
                    return BASE_URL+'<QUESTION_TYPE>/templates/<QUESTION_TYPE>/'+scope.question.options.templateUrl;
                else
                    return BASE_URL+'<QUESTION_TYPE>/templates/ionic/<QUESTION_TYPE>.html';
            }
            
// Compile the template into the directive's scope.
$http.get(scope.getContentUrl(), { cache: $templateCache }).success(function(response) {
                var contents = element.html(response).contents();
                $compile(contents)(scope);
            });

```

Remember to also inject your three dependencies (`$http`, `$templateCache`, and `$compile`) within the `module.directive` API.

```
angular.module('p97.questionTypes')  
  .directive('<QUESTION-TYPE>', ['$http', '$templateCache', '$compile', function($http, $templateCache, $compile) {
  
```

----

## 13. The Build Process
The process compiles all the ccs, js, and html templates needed for p97 component from the `src/` directory and puts the output in the `dist/` directory. The dist/ directory has everything needed and is what is installed when a user runs `bower install p97-components`.

The build process is defined in `/gulpfile.js` and can be configured there. 

To build the dist folder run 
```
gulp
```

### 13.1 Distribution Directory Structure

```
dist/
  - viewpoint/
    - services.min.js
    - question-types.min.js 
    - question-types/
      - <QUESTION-TYPE>/
        - templates/
          - ionic/   
            - <QUESTION_TYPE>.html
```



Once you have a new version built you will need to tag it and then push. For instance of you are working on the v0.3 branch and our satisifed with your changes, you can push using 
```
git commit -m "Blah blah"
git tag v0.3.12
git push origin v0.3 --tag
```

To check your vresion, create a temporary folder and boew install it.
```
mkdir tmp
cd tmp
bower install p97-components
```



----
## 14. Testing

Test are ran through the example app. 

To run tests
```
cd example
grunt test
```

I am following https://github.com/karma-runner/karma-ng-html2js-preprocessor

And here
http://angular-tips.com/blog/2014/06/introduction-to-unit-test-directives/


