
# p97-components

A collection of angular component to be used with Viewpoint 2.

## Table of Contents 

* [1. Usage](#1-usage)
* [2. The Example App](#2-the-example-app) 
* [3. Authentication](#3-authentication)
* [4. Question Types](#4-question-types)
* [5. Angular Services](#5-angular-services)
* [6. Form and Block Controllers](#6-form-and-block-controllers)
* [7. For Developers](#7-for-developers)
* [8. The Build Process](#8-the-build-process)
* [9. Testing](#9-testing)


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
<script src="PATH_TO_JS_LIB/p97-components/services.min.js"></script>
<script src="PATH_TO_JS_LIB/p97-components/question-types.min.js"></script>
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
To log the user in call `$vpApi.authenticate(data, onSuccess, onError)`. Where data contains the keywords: `username`, `password`, `stayLoggedIn`.     

On successful authentication the service will attempt to download the user's authorized formstack as well as any responses the user already has for that formstack. And if 'stayLoggedIn` is will save the user and token to localStorage. 



## 4. Question Types
Viewpoint 2 defines ?? different question types. See the Viewppoint API at /api/v2/formstack/question-type/ to see the list. Each question type has a corresponding directive. By default a question does not require an answer. To require an answer user `'require': true` in the options object.

* **datetime** (only date component of datetime was added in v 0.3 - functional in v 0.4)
 options
  * templateUrl: 
		  * "ionic/inline.html"
		  * "ionic/popup.html"
		  * "yeoman/inline.hmtl"
		  * "yeoman/popup.html"
  * initial
  * min 
  * max
  * datejs_format: [String] e.g. 'MM/dd/yyyy HH:mm:ss'
  * required
  * default

* **number** - This can either be a decimal or an integer
 options
  * min
  * max
  * required
  * default
 
* **textarea**
  `min_word` and `max_word` take precedence over `min_char` and `max_char`
 options
  * min_word
  * max_word
  * min_char
  * max_char
  * show_word_count
  * show_char_count
  * required
  * default

* **yes-no** (deprecated in v 0.4 in favor of toggle)
 options
 * default: 'yes'

* **single-select**
options
  * templateUrl
     * "ionic/drop-down.html"
     * "ionic/radio.html"
  * choices_from_previous_question: [String] the question slug to who's choices to use as choices for this question.
  * choices_from_previous_answer: [String] the question slug who's answers to use as choices for this question.  
  * required: [Boolean] defaults to `true`
  * default


### Available in v 0.4
* **multi-select**
options
  * templateUrl 
     * "ionic/drop-down.html"
     * "ionic/expanded.html"
  * grouping
  * random_order
  * random_order_groups
  * choices_from_previous_question: [String] the question slug to who's choices to use as choices for this question.
  * choices_from_previous_answer: [String] the question slug who's answers to use as choices for this question.  
  * required
  * default

* **date** 
 options
  * templateUrl: 
		  * "ionic/time.html"
		  * "ionic/popup.html"
		  * "yeoman/time.html"
		  * "yeoman/popup.html"
  * initial
  * min 
  * max
  * datejs_format: [String] e.g. 'MM/dd/yyyy'
  * required
  * default

* **time** 
 options
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
options
  * default: [String] 'checked', 'unchecked'
  * required

* **toggle**
options
  * positive_value
  * positive_label
  * negative_value
  * negative_label
  * required

* **phone-number**
options
  * format: "(xxx) xxx-xxxx"
  * required
  * default

* **email**
options
  * required
  * default

* **integer**
options
  * min
  * max
  * required
  * default

* **currency**
options
* min
* max
* code: [String] ISO 4217 currecny code e.g. 'USD', 'EUR'
* required
* default

----
##5. Angular Services

These are located in `services.js`. To load these into your app inject `vpApi.services` to your module. Most services defined a load function that loads the data from localStorage. 

###$vpApi
Handles authentication and base HTTP requests.

###$formstack
Resource: `/api/v2/pforms/formstack`
Handles fetching and updates from a read-only endpoint. 

###$form
Possibly deprecated in v0.5
###$block
Possibly deprecated in v0.5

###$formResponse
Handles creation of form responses with a `cid` as well as some getters.

###$blockResponse
Handles creation of block responses with a `cid` as well as some getters based on block response index.
###$answers
Handles fetching updates from API as well as creating and updating answers locally. 

###$profile

###$localStorage

---

##6. Form and Block Controllers

###6.1 FormCtrl.js
This controller handles the loading of a **Form** and the display and navigation controls of it's blocks. It also handles the loading of initial values for the questions in a block. The initial values come from either the `question.options.default` of from a previous answer for that Form and Block response, with a previous answer taking precedence over the default value. 

###6.2BlockCtrl.js
The BlockCtrl handles the saving of a block. This controller inherits it's scope from `FormCtrl`. 


---

## 7. For Developers

### Getting started
This assumes you have Node and NPM installed. See their pages on how to install. It is recommended to use Homebrew if you are using a Mac

1. cd into an appropriate directory and clone the repo `git@github.com:point97/p97-angular-components.git`

2. Change to the appropriate branch 

3. Install NPM packages.
    ```
    npm install
    ```

4. See [The Example App](#the-example-app) to get the example app up and running.

### 7.1 Making Question Type Components

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
### 7.2 Question Type Directives

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
 

### 7.3 Question Methods
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

###7.4  Question Type Templates
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
  .directive('<QUESTION-TYPE>', function($http, $templateCache, $compile) {
  
```

----

## 8. The Build Process
The process compiles all the ccs, js, and html templates needed for p97 component from the `src/` directory and puts the output in the `dist/` directory. The dist/ directory has everything needed and is what is installed when a user runs `bower install p97-components`.

The build process is defined in `/gulpfile.js` and can be configured there. 

### 8.1 Distribution Directory Structure

```
dist/
  - viewpoint/
    - services.min.js
    - question-types.min.js 
    - templates/
      - ionic/
        - question-types/
          - <QUESTION-TYPE>/
            - <QUESTION-TYPE>.html
        - other-template.html   

```

Once you have a new version build you will need to tag it and then push. For instance of you are working on the v0.3 branch and our satisifed with your changes, you can push using 
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
## 9. Testing

Test are ran through the example app. 

To run tests
```
cd example
grunt test
```

I am following https://github.com/karma-runner/karma-ng-html2js-preprocessor

And here
http://angular-tips.com/blog/2014/06/introduction-to-unit-test-directives/




