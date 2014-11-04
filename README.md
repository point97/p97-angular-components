
# p97-components

A collection of angular component used by Point 97.

# Usage

**Note:** This section describes how to use the components in your application. For instruction to develope components see [For Developers](#for-developers)

```
# Save to dependencies
bower install p97-components --save

```

This will install a directory named `p97-components` containing 
* p97-componnets.js
* p97-components.min.js
* question-types.js
* question-types.min.js
* templates/

```
<script src="PATH_TO_JS_LIB/p97-components/p97components.js"></script>
```

To update an existing installation use
```
bower install p97-components --save
```

---
## The Example App
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


Viewpoint 2 defines ?? different question types. See the Viewppoint API at /api/v2/formstack/question-type/ to see the list. Each question type has a corresponding directive.



----
## For Developers

### Getting started
This assumes you have Node and NPM installed. See their pages on how to install. It is recommended to use Homebrew if you are using a Mac

1. cd into an appropriate diectory and clone the repo `git@github.com:point97/p97-angular-components.git`

2. Change to the appropriate branch 

3. Install NPM packages.
    ```
    npm install
    ```

4. See [The Example App](#the-example-app) to get the example app up and running.


## Reference
### Question Types
Viewpoint 2 defines ?? different question types. See the Viewppoint API at /api/v2/formstack/question-type/ to see the list. Each question type has a corresponding directive. By default a question does not require an answer. To require an answer user `'require': true` in the options object.

* **datetime** 
 options
  * min 
  * max
  * required

* **number**
 options
  * min
  * max
  * required
 
* **textarea**
  `min_word` and `max_word` take precedence over `min_char` and `max_char`
 options
  * min_word
  * max_word
  * min_char
  * max_char
  * show_word_count
  * show_char_count

* **yes-no**
 options
 * default


### Making Question Type Components

There are several steps required to make a new question type directive but here is a breif outline.

1. Make a new directory named `src/viewpoint/question-types/<QUESTION-TYPE>/`. See the [directory structure below](#source-directory-structure).

2. Create your directive(s)  in `src/.../<QUESTION-TYPE>/directives.js` (Do the same for the controllers is needed).  You directive should be named with the question type slug. See the [Question Type Directive](#question-type-directives) section below for a description of the scope and methods the directive must have. 

3. Add templates to  `src/viewpoint/question-types/<QUESTION-TYPE>/templates/<THEME-NAME>/`. The THEME-NAME for vpMarket is **ionic**. There should always be a template named `<QUESTION-TYPE>.html` if additional templates are needed, you are free to name them how you want.  

4. Document the question type and all it's options in p97-angular-components README.md file (this document).

4. Add your question type to the example app to test it.

5. Write a Jasmine test for the directive. See the [Testing](#testing) section for this. 

6. Update the Viewpoint API to add the new question type and its default options.  

7. Build a new version, tag it and push the tag.  See [The Build Process](#the-build-process) for more info. 

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


### Question Type Directives

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
 

#### Question Methods
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

### Question Type Templates
Templates are grouped by themes. Themes usually depend on the front-end framework being used (e.g. Boostrap, Ionic, or Foundation) or platform being used, desktop vs. phonegap. 

Each directive must have a template name using the question type's slug. Templates should handle the displaying of all error messages. 

----
## The Build Process
The process compiles all the ccs, js, and html templates needed for p97 component from the `src/` directory and puts the output in the `dist/` directory. The dist/ directory has everything needed and is what is installed when a user runs `bower install p97-components`.

The build process is defined in `/gulpfile.js` and can be configured there. 

### Distribution Directory Structure

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
## Testing

I am following https://github.com/karma-runner/karma-ng-html2js-preprocessor

And here
http://angular-tips.com/blog/2014/06/introduction-to-unit-test-directives/




