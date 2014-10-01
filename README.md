# p97-angular-components

A collection of angular component used by Point 97.

Each components is contained in a directory strucuted as follows

##Installation

```

bower install p97-components

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
bower install p97-angular-components --save
```


##Developer

### Getting started
THIS SECTION IS INCOMPLETE
Clone repo and run 
```
npm install
```

### Creating Question Types

All directives must accept question and answer objects. Options for the question will be defined
in question.options.

All directives must record their answers in an answer object. Answer objects have the following
keywords

* value - A the actaull answer that is recorded. This could be a JSON object. 
* verbose (optional) - A human readable name to display as the answer.


##Example
There is an example application used for testing and a tutorial located in `examples/`

This example is build on Yeoman and it's Angular generator. See http://yeoman.io/codelab/setup.html for more info. You will need Ruby installed and up-to-date, and node and npm installed and up-to-date.

To run the example app

```
grunt serve
```

### Troubleshooting
If you get a compass error try 


```
sudo gem update --system
gem install sass
gem install compass
```

