my = {};
my.current = {};
    my.current.form = {};
    my.current.block = {
        questions: [{
            "body": "how are you doing?",
            "label": "how are you?",
            "slug": "how-are-you",
            "type": "textarea",
            "options": {
                "required": true,
                "min_word": 3,
                "max_word": 10,
                "show_word_count":true,
                "show_char_count":true
            }
        },{
            "body": "When did that happen?",
            "label": "mm/dd/yyyy",
            "type": "datetime",
            "options": {
                "required": true,
                "datejs_format": "MM/dd/yyyy"
            }
        },{
            "body": "This is a yes-no question. Do you like cheese?",
            "label": "do you like cheese",
            "type": "yes-no",
            "options": {"required": true}
        },{
            "body": "This is a number question. I can be a decimal. Enter a number between 1 and 10",
            "label": "enter a number",
            "type": "number",
            "slug": "num",
            "options": {
                "required": true,
                "min": 1,
                "max": 10
            }
        }]
    };