# Question Types

Viewpoint 2 defines ?? different question types. See the Viewppoint API at /api/v2/formstack/question-type/ to see the list. Each question type has a corresponding directive.

## Question Types

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

* **yes-no**
 options
 * defa