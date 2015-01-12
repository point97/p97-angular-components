angular.module('survey.services', [])

.factory('$formUtils', ['$vpApi', '$location', function($vpApi, $location) {
    var obj = this;
    
    setState = function(scope, state, stateParams){
        scope.current = {
            fsResp: null,
            
            form: null,
            formIndex: null,
            formResp: null,

            block: null,
            blockIndex: null,
            blockResp: null,

            qIndex: null

        };
        // Getting loki Collection for queries
        scope.formstack = $vpApi.getFormstack();
        scope.fsResps = $vpApi.db.getCollection('fsResp');
        scope.formResps = $vpApi.db.getCollection('formResp');
        scope.blockResps = $vpApi.db.getCollection('blockResp');
        scope.answers = $vpApi.db.getCollection('answer');
        scope.medias = $vpApi.db.getCollection('media');


        scope.forEach = [];  // The foreach items for repeatable questions
        if (stateParams.fsRespId === 'new') {
            // Set the current form and block
            scope.current.form = scope.formstack.forms[0];
            scope.current.formIndex = 0;
            
            scope.current.block = scope.formstack.forms[0].blocks[0];
            scope.current.blockIndex = 0;
        } else {
            // Set current fsResp
            scope.current.fsResp = scope.fsResps.get(parseInt(stateParams.fsRespId, 10));
            if (!scope.current.fsResp) console.error('Could not find Formstack Response: ' + stateParams.formRespId);
        }

        
        if (state.current.name === 'app.map-form-foreach'
            || state.current.name === 'app.map-form') {
            scope.repeatCount = 0;
            if ($location.hash().length === 0){
                $location.hash("intro");
            }
            scope.hash = $location.hash();

            scope.medias = $vpApi.db.getCollection('media');
            stateParams.formRespId = 'new';
            scope.selectedFeatures = {
                'type:': 'FeatureCollection',
                'features': []
            };
    
        
            scope.current.form = _.find(scope.formstack.forms, function(form){
                return (form.id === parseInt(stateParams.formId, 10));
            });
            scope.current.block = scope.current.form.blocks[0]; // Map forms only have one block.
            
            stateParams.qIndex = stateParams.qIndex || 'intro';
            
            // Set the repeatItem if appropriate.
            scope.current.formRepeatItem;
            if (scope.current.formResp && scope.current.formResp.formRepeatItem) {
                scope.current.formRepeatItem =  scope.current.formResp.formRepeatItem;
            }
            scope.current.formIndex = _.indexOf(scope.formstack.forms, scope.current.form);
            scope.current.blockIndex = _.indexOf(scope.current.form.blocks, scope.current.block);

            // Check for forEach options and populate scope.forEach
            if (scope.current.form.options.forEach && scope.current.form.options.forEach.length > 0) {
                debugger
            } else if (scope.current.form.options.forEachAnswer && scope.current.form.options.forEachAnswer.length > 0) {
                var ans = _getAnswer(scope, scope.current.form.options.forEachAnswer, scope.current.fsRespId);
                var verbose;
                scope.forEach = [];
                _.each(ans.value, function(val){
                    // TODO Look up verbose value from question.choices.
                    //verbose = _.find(question.choices, function(choice){return(choice.value === val);}) || val;
                    scope.forEach.push({'verbose': val, 'value':val});
                });
            } else {
                scope.forEach = [{'verbose':'', 'value':'default'}];
            }

            // Use the first question of the block as the map question. This is where the geoJson is
            // stored for each block.
            scope.mapQuestion = scope.current.block.questions[0];
            _.each(scope.current.block.questions, function(q){
                q.form = {show:false};
            });


        } else {  // Default form case. Sets the form and block resps.
            // Get or create a form response. This should be moved to $formResp.objects.getOrCreate()
            if (stateParams.formRespId.split('-')[0] === 'new') {
                var rs = stateParams.formRespId.split('-');
                if (rs.length === 2){
                    // We are gettting a new formResp from a specific formId
                    var formId = parseInt(rs[1], 10);
                    scope.current.form = _.find(scope.formstack.forms, function(form){
                        return (form.id === formId);
                    });
                    scope.current.formIndex = _.indexOf(scope.formstack.forms, scope.current.form);
                    //scope.formResp = scope.formResps.get(formId);

                } else {
                    // This is redundant, should be removed
                    var formId = null;
                    scope.current.form = scope.formstack.forms[0];
                    scope.current.formIndex = 0;
                }
            } else {
                // We expect to have a formRespId
                if (stateParams.formRespId.length < 1) console.error('No formRespId found in the URL');

                scope.current.formResp = scope.formResps.get(parseInt(stateParams.formRespId, 10));
                scope.current.formIndex = scope.current.formResp.formIndex;
                scope.current.form = scope.formstack.forms[scope.current.formIndex];
            }

            // Get or create a block response. This should be moved to $blockResp.objects.getOrCreate()
            if (stateParams.blockRespId.split('-')[0] === 'new') {
                // This is a new block
                var rs = stateParams.blockRespId.split('-');
                if (rs.length === 2 ){
                    var blockId = parseInt(rs[1],10);
                    scope.current.block = _.find(scope.current.form.blocks, function(block){
                        return (block.id === blockId);
                    });
                    scope.current.blockIndex = _.indexOf(scope.current.form.blocks, scope.current.block);
                } else {
                    // This is redundant, should be removed
                    scope.current.block = scope.current.form.blocks[0];
                    scope.current.blockIndex = 0;
                }
            } else {
                // We expect to have a formRespId
                if (stateParams.blockRespId.length < 1) console.error('No blockRespId found in the URL');

                scope.current.blockResp = scope.blockResps.get(parseInt(stateParams.blockRespId, 10 )) ;
                scope.current.blockIndex = scope.current.blockResp.blockIndex;
                scope.current.block = scope.current.form.blocks[scope.current.blockIndex];
            }

            if (scope.current.block.options.forEachAnswer && scope.current.block.options.forEachAnswer.length > 0) {
                var ans = _getAnswer(scope, scope.current.block.options.forEachAnswer, scope.current.fsRespId);
                var verbose;
                scope.forEach = [];
                _.each(ans.value, function(val){
                    // TODO Look up verbose value from question.choices.
                    //verbose = _.find(question.choices, function(choice){return(choice.value === val);}) || val;
                    scope.forEach.push({'verbose': val, 'value':val});
                });
            }
        }



    };


    _getAnswer = function(scope, qSlug, fsRespId){
        /*
        A shortcut function to make survey authoring a little easier. You can 
        can this from options.skipWhen or options.repeat_count, etc...

        */ 

        fsRespId = fsRespId || scope.current.fsResp.$loki;

        answers = $vpApi.db.getCollection('answer');
        var ans = $vpApi.db.getCollection('answer').chain()
            .find({'questionSlug':qSlug})
            .find({'fsRespId': fsRespId})
            .data();

        if (ans.length > 1){
            console.log("found more than one answer, returns the first one.");
            console.table(ans);
            ans = ans[0];
        } else if (ans.length === 1){
            ans = ans[0];
        } else {
            ans = null;
        }
        console.log('Found answer: ' + ans );
        return ans;
    };


    getEligibleBlock = function(direction, form, currentBlockIndex){
        /*
            Check for repeated block and skipWhen logic. 

            Returns a block or null if no eligilbe block is found on the form.
        */ 
        var out;
        var block;
        var rs;
        var blocks = form.blocks;
        

        function findEligibleBlock(direction){
            console.log("[findEligibleNextBlock] looking for blockIndex " + currentBlockIndex);
            
            if (direction === 'forward') {
                block = blocks[currentBlockIndex + 1];
            }else {
                block = blocks[currentBlockIndex - 1];
            }

            if (block){
                if (typeof(block.options.skipWhen) !== 'undefined'){
                    rs = eval(block.options.skipWhen);

                    console.log('answer ')
                    console.log(getAnswer('marine-activities'))
                    if (rs){
                        console.log('[_getNextBlock()] I need to skip this block and get the next one');

                        if (direction === 'forward'){
                            // Increase index by 1
                            currentBlockIndex++;
                        } else {
                            currentBlockIndex--;
                        }
                        
                        findEligibleBlock(direction);
                        // 
                    } else {
                        console.log('[_getNextBlock()] I can use this block.');
                    }
                } // End if skipWhen
            } else {
                console.log("[_getNextBlock] there are no more blocks on this form" );
            }
            return block;
        };

        block = findEligibleBlock(direction);
        return block
    };



    getEligibleForm = function(direction, currentFormIndex) {
        /*
            Checks for repeated form and skipWhen logic. 
            
            Inputs:
            - direction - [String] 'forward', 'back'
            

            Returns a form or null if no eligilbe form is found on the formstack (i.e. you are done with the survey) 
        */

        var forms = $vpApi.getFormstack().forms;

        function findEligibleForm(direction){
            console.log("[findNextEligibleForm] looking for formIndex " + currentFormIndex);
            if (direction === 'forward'){
                form = forms[currentFormIndex + 1];
            } else {
                form = forms[currentFormIndex - 1];
            }
            if (form){
                if (typeof(form.options.skipWhen) !== 'undefined'){
                    rs = eval(form.options.skipWhen);

                    if (rs){
                        console.log('[_findNextEligibleForm()] I need to skip this form and get the next one');

                        if (direction === 'forward') {
                            // Increase index by 1
                            currentFormIndex++;
                        } else {
                            currentFormIndex--;
                        }
                        
                        findEligibleForm(direction);
                    } else {
                        console.log('[_findNextEligibleForm()] I can use this form.');
                    }
                } // End if skipWhen
            } else {
                console.log("[_getNextBlock] there are no more forms on this form" );
            }
            return form;
        }

        form = findEligibleForm(direction);
        return form;
    };

    loadAnswers = function($scope, fsRespId, formRespId, blockRespId){
        /*

        Get the previous answers to questions and assigns them to q.value for each quesiton 
        in the block. If there are no previous answers the question.value is assign to question.options.default
        or a blank string if no default is present.

        */
        //$scope.previousAnswers = $answers.getByBlockId($scope.current.block.id, $stateParams.blockResponse); // This returns a list of lists of answers.
        console.log("[$formUtils.loadAnswers()]")
        var isNew = false;
        
        formRespId = formRespId + "";
        blockRespId = blockRespId + "";

        if (fsRespId === 'new' 
            || formRespId.split('-')[0] === 'new'
            || blockRespId.split('-')[0] === 'new') isNew = true;


        if (isNew){
            $scope.previousAnswers = [];
        } else {
            $scope.previousAnswers = $scope.answers.chain()
               .find({'fsRespId': parseInt(fsRespId, 10)})
               .find({'formRespId': parseInt(formRespId, 10)})
               .find({'blockRespId': parseInt(blockRespId, 10)})
               .data();
        };

        // Loop over answers and set defaults
        _.each($scope.current.block.questions, function(q){
            // Get the answer for the question
            var ans = _.find($scope.previousAnswers, function(pans){
                return (pans.questionId === q.id);
            });

            console.log("[loadAnswers] Question: " + q.slug )
            if (ans) {
                q.value = ans.value;
                q.previousValue = ans.value;
                q.answerCid = ans.$loki;
            } else if ( typeof(q.options['default']) !==  'undefined'){
                q.value = q.options['default'];
                q.previousValue = q.options['default'];
                q.answerCid = null;
            } else {
                q.value = '';
                q.previousValue = '';
                q.answerCid = null;
            }
        });
    };

    // Watch the url for hash changes.
    parseHash = function(raw){
        /*
        Returns 'intro', 'end', or [formRespId, blockRespId, qIndex]

        */ 
        var out;
        if (raw === 'intro' || raw === 'end') {
            return raw;
        } 

        var pieces = raw.split("/");
        if (pieces.length === 3){
            formRespId = pieces[0];
            blockRespId = pieces[1];
            qIndex = parseInt(pieces[2]);
            out = [formRespId, blockRespId, qIndex]
        } else {
            out = raw;
        }

        return out;
    }

    return {
        setState:setState,
        getAnswer:_getAnswer,
        getEligibleForm: getEligibleForm,
        getEligibleBlock: getEligibleBlock,
        loadAnswers: loadAnswers,
        parseHash: parseHash
    }
}])






