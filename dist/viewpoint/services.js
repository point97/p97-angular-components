// build timestamp: Tue Jan 20 2015 11:05:25 GMT-0800 (PST)
/*
Github Repo: https://github.com/point97/p97-angular-components.git
Version: 15.01.16a

*/
angular.module('survey.services', [])

.factory('$formUtils', ['$vpApi', '$location','$formstack', '$formResp', function($vpApi, $location, $formstack, $formResp) {
    var obj = this;
    
    setState = function(scope, state, stateParams){
        /*
        Sets scope.current with appropriate variables based on the URL and the hash.
        
        */
        
        scope.current = {
            fsResp: null,
            
            form: null,
            formIndex: null,
            formResp: null,

            block: null,
            blockIndex: null,
            blockResp: null,

            qIndex: null,
            hash: null

        };
        // Getting loki Collection for queries
        scope.formstack = $vpApi.getFormstack();
        scope.fsResps = $vpApi.db.getCollection('fsResp');
        scope.formResps = $vpApi.db.getCollection('formResp');
        scope.blockResps = $vpApi.db.getCollection('blockResp');
        scope.answers = $vpApi.db.getCollection('answer');
        scope.medias = $vpApi.db.getCollection('media');


        if (stateParams.fsRespId === 'new') {
            // Set the current form and block
            scope.current.form = angular.copy(scope.formstack.forms[0]);
            scope.current.formIndex = 0;
            
            scope.current.block = angular.copy(scope.formstack.forms[0].blocks[0]);
            scope.current.blockIndex = 0;
        } else {
            // Set current fsResp
            scope.current.fsResp = scope.fsResps.get(parseInt(stateParams.fsRespId, 10));
            if (!scope.current.fsResp) console.error('Could not find Formstack Response: ' + stateParams.formRespId);
        }

        
        if (state.current.name === 'app.map-form-foreach' || state.current.name === 'app.map-form') {
            /*
            Sets 
            scope.current.form
            scope.current.formIndex

            scope.current.block
            scope.current.blockIndex
            
            scope.current.hash
            scope.selectedFeatures
            stateParams.qIndex  // NOT SURE WE NEED THIS
            scope.mapQuestion

            scope.current.formRepeatItem
            scope.repeatCount

            And sets 
            questions.form.show to false

            */
            
            scope.repeatCount = 0;
            if ($location.hash().length === 0){
                $location.hash("intro");
            }
            scope.current.hash = $location.hash();

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
                debugger;
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

        } else if (state.current.name === 'app.form-foreach') {
           /*
            forEach form case.
            Sets:
            scope.current.form
            scope.current.formIndex
       

            scope.current.page
            */

            scope.current.form = _.find(scope.formstack.forms, function(form){
                return (form.id === parseInt(stateParams.formId, 10));
            });
            scope.current.formIndex = _.indexOf(scope.formstack.forms, scope.current.form);
            scope.current.page = stateParams.page;
            scope.current.form.forEach = null;
            scope.current.form.repeatItem = null;

        } else {  
            /* 
            Default form case. 
            Sets
            
            scope.current.form
            scope.current.formResp
            scope.current.formIndex

            scope.current.block
            scope.current.blockResp
            scope.current.blockIndex
            
            Also sets
            
            scope.current.form.forEachItem

            */

            //Get or create a form response. This should be moved to $formResp.objects.getOrCreate()
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

            
        } // End default case


        /* 
        Set form forEach variables:
        scope.current.form.forEach
        scope.current.form.forEachItem

        scope.current.block.forEach
        scope.current.block.forEachItem


        */

        if (scope.current.form.options.forEach && scope.current.form.options.forEach.length > 0) {
            // TODO This is not yet implemented
            debugger;
        } else if (scope.current.form.options.forEachAnswer && scope.current.form.options.forEachAnswer.length > 0) {
            var ans = _getAnswer(scope, scope.current.form.options.forEachAnswer, scope.current.fsRespId);
            var verbose, question, choice;
            scope.current.form.forEach = [];
            _.each(ans.value, function(val){
                choice = $formstack.getChoice(scope.current.form.options.forEachAnswer, val);
                scope.current.form.forEach.push(choice);
            });
        }
        if (scope.current.form.forEach){
            // This will populate the forEachItems with formResp and blockResp.
            // It also keeps the formResp in sync with the answers selected 
            loadFormForEachItems(scope);

        }
        


        if (scope.current.block){
            // Set block forEach variable
            if (scope.current.block.options.forEach && scope.current.block.options.forEach.length > 0) {
                // TODO This is not yet implemented
                debugger
            } else if (scope.current.block.options.forEachAnswer && scope.current.block.options.forEachAnswer.length > 0) {
                var ans = _getAnswer(scope, scope.current.block.options.forEachAnswer, scope.current.fsRespId);
                var verbose;
                scope.current.block.forEach = [];
                _.each(ans.value, function(val){
                    // TODO Look up verbose value from question.choices.
                    //verbose = _.find(question.choices, function(choice){return(choice.value === val);}) || val;
                    scope.current.block.forEach.push({'verbose': val, 'value':val});
                });
            }
        }

        // Set the repeatItem
        if (scope.current.formResp && typeof(scope.current.formResp.formForEachItem) !== 'undefined'){
            choice = $formstack.getChoice(scope.current.formResp.formForEachQuestionSlug, scope.current.formResp.formForEachItem);
            scope.current.form.forEachItem = choice; 
        }

    }; // End setState()


    changeState = function($scope, $state, action){
        /*
        Changes $state based on the aciton.

        Inputs:
        action: [String] 'forward', 'back'
        */
        var newState = 'app.';
        var newStateParams;
        var nextBlock, nextForm;
        var prevFormResp;
        var prevBlockResp 
        var newHash = null;

        var blocks = $scope.current.form.blocks; // This will go away completely, just need to defined _getPrevEligibleBlock().
        

        getAnswer = function(qSlug){
            /*
            A shortcut function to make survey authoring a little easier. You can 
            can this from options.skipWhen or options.repeat_count, etc...

            */ 

            fsRespId = $scope.current.fsResp.$loki;
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
                console.error("[]getAnswer] No answer found");
            }
            console.log('Found answer: ' + ans );
            return ans;
        };

        if (action === 'forward' || action === 'repeat-block' || action === 'repeat-form') {
            
            if (action === 'forward') {
                if ($scope.current.page === 'end' || $scope.current.page === 'intro'){
                    nextBlock = null;
                } else {
                    // See if there is another eligable block
                    nextBlock = this.getEligibleBlock(action, $scope.current.form, $scope.current.blockIndex);
                }
                
                
            } else if (action === 'repeat-block' || action === 'repeat-form') {
                nextBlock = $scope.current.block;
            }
                        
            if (nextBlock) {
                console.log('[LinearBlockCtrl.saveBlock()] found next block, setting state');

                // Get the an already existing blockResp or make a new one
                var blockRespId, page;
                if (action === 'forward') {
                    formRespId = $scope.current.formResp.$loki
                    var blockResps = $scope.blockResps
                        .chain()
                        .find({'blockId':nextBlock.id})
                        .find({'formRespId':$scope.current.formResp.$loki})
                        .data();

                    if (blockResps.length > 0) {
                        blockRespId = blockResps.slice(-1)[0].$loki; // Grab the last one.
                    } else {
                        blockRespId = 'new-' + nextBlock.id
                    }

                } else if (action === 'repeat-form') {
                    
                    if ($scope.current.form.type === 'map-form'){
                        $location.hash('intro');
                        return
                    } else {
                        // TODO Add non map for repeat action
                        debugger
                        $scope.current.formRepeatItem = null;
                        formRespId = 'new-' + $scope.current.form.id;
                        blockRespId = 'new-' + nextBlock.id;
                    }
                } else if (action === 'repeat-block') {
                    if ($scope.current.form.type === 'map-form'){
                        // Just change the hash, not the URL.
                        var blockRespId = "new-" + $scope.current.block.id; // This is the server Id.
                        $location.hash([formRespId, blockRespId, 0].join("/"));
                        return;
                    } else {
                        formRespId = $scope.current.formResp.$loki
                        blockRespId = 'new-' + nextBlock.id;
                        newHash = '0'  // TODO Make this a conditional based on if newForm is a map-form.                        
                    }

                }
                
                newState += ($scope.current.form.type) ? $scope.current.form.type : 'form';
                if($scope.current.form.forEach){
                    // If it is the last block in the forEach form send to end page.
                    if (_.indexOf($scope.current.form.blocks, nextBlock) === $scope.current.form.blocks.length - 1){
                        newState += "-foreach";
                        page = 'end';
                    }                    
                }
                newStateParams = {
                    'fsSlug': $scope.formstack.slug,
                    'fsRespId': $scope.current.fsResp.$loki,
                    'formRespId': formRespId,
                    'formId': $scope.current.form.id,
                    'blockRespId': blockRespId,
                    'hash': newHash,
                    'page': page,
                    'qIndex': newHash
                }
                $state.go(newState, newStateParams);
                return;

            } else {
                console.log('[LinearBlockCtrl.saveBlock()] No more blocks in this form, so grabbing the first block of the next form');
                //nextForm = $scope.formstack.forms[$scope.current.formIndex + 1];
                nextForm = this.getEligibleForm(action, $scope.current.formIndex);
                if (nextForm){
                    nextBlock = getEligibleBlock('forward', nextForm, -1);

                    newState += (nextForm.type) ? nextForm.type : 'form';
                    if(nextForm.options.forEach || nextForm.options.forEachAnswer){
                        newState += "-foreach";
                        newHash = 'intro'; // This is used be the map-form

                    }
                    newStateParams = {
                        'fsSlug': $scope.formstack.slug,
                        'fsRespId': $scope.current.fsResp.$loki,
                        'formId': nextForm.id,
                        'formRespId': 'new-' + nextForm.id,
                        'blockRespId': 'new-' + nextBlock.id,
                        'hash': newHash, // This is used by map-form-foreach
                        'page': newHash, // This is used by form-foreach
                        'qIndex': 'intro'
                    }
                    $state.go(newState, newStateParams);
                    return;
                   

                } else {
                    console.log('[LinearBlockCtrl.saveBlock()] No more forms. You are done.');
                    // Update the fsResp

                    $scope.current.fsResp.status = 'complete';
                    $scope.current.fsResp.cupdate = $vpApi.getTimestamp();
                    $vpApi.db.save();
                    
                    console.log('[LinearBlockCtrl.saveBlock()] No more forms. You are done.');
                    $state.go('app.complete');  // Use $state.go here instead of $location.path or $location.url
                    return;
                }
            }

        } else if (action === 'back'){
            // See if there is a previous block
            prevBlock = this.getEligibleBlock(action, $scope.current.form, $scope.current.blockIndex);

            if (prevBlock){
                
                console.log('[LinearBlockCtrl.saveBlock()] found next block');
                
                // Get the last blockResp
                //var prevBlockResps = $scope.blockResps.find({blockId:prevBlock.id})
                var prevBlockResps = $scope.blockResps.chain()
                    .find({blockId:prevBlock.id})
                    .find({formRespId:$scope.current.formResp.$loki})
                    .data();

                if (prevBlockResps.length > 0){
                    prevBlockResp = prevBlockResps.slice(-1)[0];
                } else {
                    prevBlockResp = {'id':'new-'+prevBlock.id};
                }

                newState += ($scope.current.form.type) ? $scope.current.form.type : 'form';
                newStateParams = {
                    'fsSlug': $scope.formstack.slug,
                    'fsRespId': $scope.current.fsResp.$loki,
                    'formRespId': $scope.current.formResp.$loki,
                    'blockRespId': prevBlockResp.$loki,
                    'hash': newHash
                }
            } else {
                console.log('[LinearBlockCtrl.saveBlock()] This is the first block in the form');
                //prevForm = $scope.formstack.forms[$scope.current.formIndex - 1];
                
                prevForm = this.getEligibleForm(action, $scope.current.formIndex);
                if (prevForm){
                    console.log('[LinearBlockCtrl.saveBlock()] Found prev form');
                    
                    // Get the last form response
                    var prevFormResp = $scope.formResps
                        .chain()
                        .find({fsRespId: $scope.current.fsResp.$loki})
                        .find({formId:prevForm.id})
                        .data();
                    
                    if (prevFormResp.length > 1) {
                        prevFormResp = prevFormResp.slice(-1)[0];
                    } else if (prevFormResp.length === 1){
                        prevFormResp = prevFormResp[0];
                    } else {
                        prevFormResp = {'id':'new-'+prevForm.id};
                    }
                    
                    // Get the last blockResp from the last eligible block of the previous form
                    var prevBlock = this.getEligibleBlock(action, prevForm, prevForm.blocks.length);

                    var prevBlockResp = $scope.blockResps
                        .chain()
                        .find({blockId:prevBlock.id})
                        .find({formRespId:prevFormResp.$loki})
                        .data();

                    if (prevBlockResp.length > 1) {
                        prevBlockResp = prevBlockResp.slice(-1)[0];
                    } else if (prevBlockResp.length === 1){
                        prevBlockResp = prevBlockResp[0];
                    } else {
                        prevBlockResp = {'id':'new-'+prevBlock.id};
                    }

                    newState += (prevForm.type) ? prevForm.type : 'form';
                    if(prevForm.options.forEach || prevForm.options.forEachAnswer){
                        newState += "-foreach";
                        page = 'intro'; // This is used be the map-form
                    }
                    newStateParams = {
                        'fsSlug': $scope.formstack.slug,
                        'fsRespId': $scope.current.fsResp.$loki,
                        'formRespId': prevFormResp.$loki,
                        'formId': prevForm.id, // This is needed for map-form and map-form-foreach
                        'blockRespId': prevBlockResp.$loki,
                        'hash': page,
                        'page': page
                    }

                } else {
                    console.log('[LinearBlockCtrl.saveBlock()] No more forms. You are done.');
                    $state.go('app.home');  // Use $state.go here instead of $location.path or $location.url
                    return;
                        
                }
            }
        };
        $scope.newStateParams = newStateParams; //This is here for testing.
        $state.go(newState, newStateParams);
    }; // End changeState();

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
        }

        block = findEligibleBlock(direction);
        return block;
    };

    // If we have forEach items, attach previous formResp and blockResp
    loadFormForEachItems = function(scope){        
        var staleFormResps;

        _.each(scope.current.form.forEach, function(item){
            item.formResp = scope.formResps.chain()
                .find({'fsRespId': scope.current.fsResp.$loki}) // There should only be one form response for a given item.
                .find({'formId': scope.current.form.id})
                .find({'formRepeatItem': item.value})
                .data();

            // A get or create on formResp and set item.formResp 
            if (item.formResp.length === 0) {
                console.log("Create a formResp for " + item);
                item.formResp = scope.formResps.insert({
                    'fsSlug':scope.formstack.slug,
                    'fsRespId': scope.current.fsResp.$loki,
                    'formId': scope.current.form.id,
                    'formIndex': scope.current.formIndex,
                    'formRepeatItem':item.value,
                    'formForEachItem':item.value,
                    'formForEachQuestionSlug': scope.current.form.options.forEachAnswer,
                    'cupdate': $vpApi.getTimestamp()
                });
                $vpApi.db.save()
            } else {
                item.formResp = item.formResp[0];
            }

            // Get the block responses. 
            item.blockResps = scope.blockResps.chain()
                .find({'fsRespId': scope.current.fsResp.$loki}) // There should only be one form response for a given item.
                .find({'formRespId': item.formResp.$loki})
                .simplesort('created')
                //.find({'formForEachItem': item.value})
                //.simplesort('created', false)
                .data()
            if (item.blockResps.length > 0) {
                item.formRespId = item.blockResps[0].formRespId;
                
                item.blockRespId = item.blockResps[0].$loki;
            } else {
                item.formRespId = "new-" + scope.current.form.id;
                item.blockRespId = "new-" + scope.current.form.blocks[0].id;
            }

            item.form = "form"
        });


        // Removes formResps and children that do not have an item in 
        // in current.form.forEach
        var res = scope.formResps.chain()
            .find({'formId': scope.current.form.id})
            .find({'fsRespId': scope.current.fsResp.$loki})
        
        // Exclude resps that have forEach items on the forRach array.
        _.each(scope.current.form.forEach, function(item){
            res.find({'formForEachItem': {'$ne': item.value }});
        });
            
        staleFormResps = res.data();
        console.log("Stale Form Resps");
        console.table(staleFormResps);
        _.each(staleFormResps, function(resp){
            $formResp.delete(resp.$loki);
        });

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
    };

    return {
        setState:setState,
        changeState:changeState,
        getAnswer:_getAnswer,
        getEligibleForm: getEligibleForm,
        getEligibleBlock: getEligibleBlock,
        loadAnswers: loadAnswers,
        parseHash: parseHash
    };
}])

/*
Github Repo: https://github.com/point97/p97-angular-components.git
Version: v15.01.16a

*/

angular.module('vpApi.services', [])

.service( '$vpApi', ['$rootScope', '$http', 'config', function($rootScope, $http, config) {
    var obj = this;
    var apiBase = config.apiBaseUri;
    this.username = '';
    this.user = {};
    this.users;
    this.dbLoaded = false
    this.dbinit = function(initCallback){
        /*
            Loads or creates the database. 

            Sets

            this.db
            this.user - A user object with keys: username, token
        */

        // Makes the loki database available at $vpApi.db.
        obj.db = data.db;
        obj.user = data.user;
        obj.users = data.db.getCollection('user');
        obj.dbLoaded = true;
        return;

        if (obj.dbLoaded === true) { 
            initCallback();
            return;
        }

        obj.loadHandler = function(){
            obj.users = obj.db.getCollection('user');

            if (obj.users && obj.users.data.length > 0 && obj.users.data[0].username){
                obj.user = obj.users.data[0];
            } else {
                obj._createDb();
            }
            obj.dbLoaded = true;
            $rootScope.$broadcast('db_loaded');
            initCallback();

        };

        var idbAdapter = new lokiIndexedAdapter('vpsurvey');
        obj.db = new loki(config.dbFilename, { 
            'adapter': idbAdapter,
            'autoload': true,
            'autoloadCallback': obj.loadHandler
        });
    }

    this.getApp = function(slug){
        var apps = $vpApi.db.getCollection('app');
        var app = apps.find({'slug':slug})[0];
        if (app.length > 0){
            return app;
        }else{
            console.log("eror getting app.")
        }
    }

    this.getFormstack = function(slug){
        console.log(slug)
        var out = null;
        var formstacks = obj.db.getCollection('formstack')
        if(slug == undefined || slug == null){
            out = formstacks.find()[0];
        }else{
            out = formstacks.find({'slug':slug})[0]
        }
        if(!out)
            console.error('[$vpApi.getFormstack()] Could not find formstack');

        return out;
    }

    this.getTimestamp = function(){
        return new Date().toISOString();
    }

    this.serialize = function(obj) {
        var str = [];
        for(var p in obj)
        if (obj.hasOwnProperty(p)) {
          str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
        }
        return str.join("&");
    }

    this.authenticate = function(data, success_callback, error_callback) {
        /*
        Inputs:
            data : object with keywords username, password, stayLoginIn
        */
        var url = apiBase + 'authenticate/';

        var headers = {}// {'Authorization':'Token ' + this.user.token};
        $http.post(url, data, headers)
            .success(function(res, status){
                var users = obj.users.find({'username': data.username});
                if (users.length === 0){
                    user = obj.users.insert({'username':data.username, token:res.token})
                } else {
                    user = users[0];
                    user.token = res.token;
                    user.username = data.username;
                    obj.users.update(user);
                }
                obj.user = user;

                obj.db.save();
                localStorage.setItem('user', JSON.stringify(obj.user));
                $rootScope.$broadcast('authenticated', {onSuccess: success_callback});
            })
            .error(function(data, status){
                error_callback(data, status)
            });
    }

    this.fetch  = function(resource, data, success, fail){

        var url = apiBase + resource + '/';
        var qs = this.serialize(data);
        url += "?" + qs;

        var config = {headers: {'Authorization':'Token ' + this.user.token}};

        $http.get(url, config).success(function(data, status){
          success(data, status);
        })
        .error(function(data, status){
          fail(data, status);
        });
    }

    this.post = function(resource, data, success, fail){
        var url = apiBase + resource + '/';
        var config = {headers: {'Authorization':'Token ' + this.user.token}};
        $http({url:url,
              method:'POST',
              data: data,
              headers: {'Authorization':'Token ' + this.user.token}
        }).success(function(data, status){
          success(data, status);
        })
        .error(function(data, status){
          fail(data, status);
        });
    }

    this.showCollection = function(collectionName){
        console.log("SHOW TABLE: " + collectionName);
        console.table(data.db.getCollection(collectionName).data);
    }

    this.dbinit();

}])

.service('$user', ['$rootScope', '$vpApi', '$app', '$formstack', '$profile', function($rootScope, $vpApi, $app, $formstack, $profile){
    var obj = this;

    $rootScope.$on('authenticated', function(event, args){
        $profile.fetch(function(){
            $vpApi.db.save(); // This is to save the profile to indexedDB.

            allowedApps = $vpApi.user.profile.allowed_apps;
            if (allowedApps.length > 0) {
                appSlug = allowedApps[0];
            } else {
                console.error("There are no allowed Apps for this user.");
                // TODO Handle the no formstack case.
            }

            // Now use the allowed_apps to get first app.
            $app.fetchBySlug(appSlug,
                function(data, status){
                    formstacks = data["formstacks"];
                    //Clear data
                    oldStacks = $vpApi.db.getCollection('formstack').find();
                    _.each(oldStacks, function(old){
                        $vpApi.db.getCollection('formstack').remove(old);
                    });
                    // Insert Most recent Fromstack data
                    _.each(formstacks, function(formstack){
                        formstack.appId = data.id;
                        formstack.appSlug = data.slug;
                        $vpApi.db.getCollection('formstack').insert(formstack);
                    });

                    // Save the changes
                    $vpApi.db.save();
                    $rootScope.$broadcast('apploaded');
                    args.onSuccess();
                },
                function(data, status){
                    console.log('[$user] failed to fetch formstack');
                    console.log(data);
                }
            );
        },
        function(data, status){
            console.log('Error fetching profile.');
        });
    })
}])

.service( '$profile', ['$http', '$vpApi', 'config', function($http, $vpApi, config){
    var obj = this;
    var apiBase = config.apiBaseUri;

    this.fetch = function(successCallback, errorCallback){
        /*
        Fetches profile and updates the obj.db. DOSE NOT save to localStorage
        */
        var url = apiBase +'account/info/?user__username=';
        var token = $vpApi.user.token;

        var headers = {headers: {'Authorization':'Token ' + token}};
        $http.get(url+$vpApi.user.username, headers)
            .success(function(data, status){
                $vpApi.user.profile = data[0];
                $vpApi.users.update($vpApi.user);
                successCallback();
            }).error(function(data, status){
                errorCallback()
            });
    };

}])

.service('$app', ['$vpApi', function($vpApi) {
    var obj = this;
    this.resource_name = 'pforms/get/app';

    this._fetchSuccess = function(data, status){
        obj.objects = data;
        var apps = $vpApi.db.getCollection('app');
        var app = apps.find({'slug':data[0].slug});
        if (app.length > 0){
            apps.remove(app);
        }
        apps.insert(data[0]);
    };

    this._fetchFail = function(data, status){
        console.log("Failed to fetch " + obj.resource_name + ". Returned Status: " + status);
        console.log(data);
    }

    this.fetchBySlug = function(slug, successCallback, errorCallback){
        /*
        Get the formstack from the VP2 server. 
        */

        if(HAS_CONNECTION){
          $vpApi.fetch(
            this.resource_name, 
            {'slug':slug}, 
            function(data, status){
                obj.objects = data;

                var apps = $vpApi.db.getCollection('app');
                var app = apps.find({'slug':slug});
                if (app.length > 0){
                    apps.remove(app);
                }
                apps.insert(data[0]);
                successCallback(data[0], status);
            },
            function(data, status){
                console.log("Failed to fetch " + obj.resource_name + ". Returned Status: " + status);
                console.log(data);
                errorCallback(data, status)
            }
          );

        }else{
            debugger
        }

    }; // fetchBySlug

    this.updateBySlug = function(slug, success, error) {
        /*
        Inputs:
            slug - [String]

            success - [Function] the success callback. This will called with arguements 
                        formstack, status from the $http.get. 
            
            error -  [Fucntion] the error callback. This will be called with arguments 
                         data, status from the $http.get
        */

        var data = {'slug':slug};
        
        $vpApi.fetch(this.resource_name, data, 
            function(data, status){
                obj._fetchSuccess(data, status);
                success(data[0]);
            },
            function(data, status){
                obj._fetchFail(data, status);
                error(data, status);
            }
        );
    };

}])

.service('$formstack', ['$vpApi', function($vpApi) {
    var obj = this;
    this.resource_name = 'pforms/formstack';

    this.formRepeatItem;  // TODO Find a better place for this. Mayeb a state service, will probably want the rest of the state stored to.


    this._fetchSuccess = function(data, status){
        obj.objects = data;
        var formstacks = $vpApi.db.getCollection('formstack');
        var formstack = formstacks.find({'slug':data[0].slug});
        if (formstack.length > 0){
            formstacks.remove(formstack);
        }
        formstacks.insert(data[0]);
    };

    this._fetchFail = function(data, status){
        console.log("Failed to fetch " + obj.resource_name + ". Returned Status: " + status);
        console.log(data);
    }

    this.fetchBySlug = function(slug, successCallback, errorCallback){
        /*
        Get the formstack from the VP2 server. 
        */

        if(HAS_CONNECTION){
          $vpApi.fetch(
            this.resource_name, 
            {'slug':slug}, 
            function(data, status){
                obj.objects = data;

                var formstacks = $vpApi.db.getCollection('formstack');
                var formstack = formstacks.find({'slug':slug});
                if (formstack.length > 0){
                    formstacks.remove(formstack);
                }
                formstacks.insert(data[0]);
                successCallback(data[0], status);
            },
            function(data, status){
                console.log("Failed to fetch " + obj.resource_name + ". Returned Status: " + status);
                console.log(data);
                errorCallback(data, status)
            }
          );

        }else{
            debugger
        }

    }; // fetchBySlug

    this.updateBySlug = function(slug, success, error) {
        /*
        Inputs:
            slug - [String]

            success - [Function] the success callback. This will called with arguements
                        formstack, status from the $http.get.

            error -  [Fucntion] the error callback. This will be called with arguments
                         data, status from the $http.get
        */

        var data = {'slug':slug};

        $vpApi.fetch(this.resource_name, data,
            function(data, status){
                obj._fetchSuccess(data, status);
                success(data[0]);
            },
            function(data, status){
                obj._fetchFail(data, status);
                error(data, status);
            }
        );
    };

    this.getQuestionBySlug = function(slug) {
        var fs = $vpApi.db.getCollection('formstack').data[0];
        var out;
        _.find(fs.forms, function(form){
            blockRes = _.find(form.blocks, function(block){
                qRes = _.find(block.questions, function(q){
                    if (q.slug === slug){
                        out = q;
                        return true;
                    }
                });
                return qRes;
            });
            return blockRes;
        });
        return out;
    };

    this.getChoice = function(qSlug, value){
        /*
            Get's a questions choice by question slug and value.
            Handles the 'other' answer case
        */
        var choice;
        var question = obj.getQuestionBySlug(qSlug);
        choice = _.find(question.choices, function(item){return(item.value === value);});
        if (!choice) {
            choice = {'verbose': 'User Enter: ' + value, 'value': value };
        }
        return choice;
    };

}])

.service('$fsResp', ['$vpApi', '$rootScope', function($vpApi, $rootScope){
    /*
        A form response is of the form
        {
            id:
            fsSlug:
        }
    */

    var obj = this;
    this.resource_name = 'pforms/formstack-response';

    $rootScope.$on('db_loaded', function(e){
        this.objects = $vpApi.db.getCollection('fsResp');
    })

    this.delete = function(fsRespId){

        var fsResp = obj.objects.get(fsRespId);
        obj.objects.remove(fsResp);


        var formResps = $vpApi.db.getCollection('formResp').find({'fsRespId': fsRespId});
        var blockResps = $vpApi.db.getCollection('blockResp').find({'fsRespId': fsRespId});
        var answers = $vpApi.db.getCollection('answer').find({'fsRespId': fsRespId});


        _.each(formResps, function(resp){
            $vpApi.db.getCollection('formResp').remove(resp);
        });

        _.each(blockResps, function(resp){
            $vpApi.db.getCollection('blockResp').remove(resp);
        });

        _.each(answers, function(resp){
            $vpApi.db.getCollection('answer').remove(resp);
        });

        $vpApi.db.save();
    }
}])

.service('$formResp', ['$vpApi', function($vpApi){
    /*
        A form response is of the form
        {
            id:
            fsRespId:
            fsSlug:
        }
    */

    var obj = this;
    this.resource_name = 'pforms/form-response';

    //this.objects = $vpApi.db.getCollection('formResp');

    this.delete = function(formRespId){

        var formResp = $vpApi.db.getCollection('formResp').get(formRespId);
        if (formResp) {
            var blockResps = $vpApi.db.getCollection('blockResp').find({'formRespId': formRespId});
            var answers = $vpApi.db.getCollection('answer').find({'formRespId': formRespId});
        } else {
            console.warn("Form Response does not exist: " + formRespId);
            return;
        }

        // Remove the responses
        $vpApi.db.getCollection('formResp').remove(formResp);
        _.each(blockResps, function(resp){
            $vpApi.db.getCollection('blockResp').remove(resp);
        });

        _.each(answers, function(resp){
            $vpApi.db.getCollection('answer').remove(resp);
        });
        $vpApi.db.save();
    }
}])

.service('$blockResponse', ['$formstack', '$block', '$rootScope', '$answers', '$formResponse', function($formstack, $block, $rootScope, $answers, $formResponse){
    /*
        A block response is of the form
        {
            id:
            fsRespId:
            fsSlug:
            formRespId:
            formId:
        }
    */
    var obj = this;
    this.resource_name = 'pforms/block-response'; //This is currently client side only

    $rootScope.$on('answer-created', function(event, data){
        debugger;
    })

}])

.service( '$answers', ['$form', '$rootScope', '$filter', '$vpApi', 'config',
               function($form, $rootScope, $filter, $vpApi, config) {
  /*
    An answer will be of the form
    {
        id:
        value:   <-- This is what the question type directive outputs.
        valueType:
        blockRespId:
        blockId:
        formRespId:
        formId:
        fsRespId:
        fsSlug:
        cupdate:
    }

  */

  var obj = this;
  this.resource_name = "pforms/answer";

}])

.service('$mediacache', ['$vpApi', '$formstack', '$http', function($vpApi, $formstack, $http){
    var obj = this;
    obj.isCached = false;

    this.run = function(){
        /*
        This should run when the app first loads.

        It uses getFileNames to return  alist of file names to
        request from the server and caches them in a Colleciton named
        'media' with a keywords 'filename' and 'data'

        */
        var fnames = obj.getFilenames();
        // Cache all geojsonChoices
        _.each(fnames, function(fname){
            $http({
                method: 'GET',
                withCredentials: true,
                url: fname
            }).success(function(data) {
                // Save this to persistent storage

                var medias = $vpApi.db.getCollection('media');
                var entry = medias.find({'fname':fname});
                if (entry.length > 0){
                    entry.cupdate = $vpApi.getTimestamp();
                    medias.update(entry);
                } else {
                    entry = {
                        'fname':fname,
                        'data':data,
                        'cupdate': $vpApi.getTimestamp()
                    }
                    medias.insert(entry);
                }
                $vpApi.db.save();

            }).error(function(data, status){
                console.log("Could not load media file ")
            });
        });
    };

    this.getFilenames = function(){
        // Get loop over formstack and get a list of files names to cache
        var fs = $vpApi.getFormstack();
        var fnames = [];
        _.each(fs.forms, function(form){
            _.each(form.blocks, function(block){
                _.each(block.questions, function(q){
                    if (q.options.geojsonChoices && q.options.geojsonChoices.url){
                        fnames.push(q.options.geojsonChoices.url);
                    }
                }); // End questions loop
            }); // End block loop
        }); // End forms loop
        fnames = _.uniq(fnames);
        console.log("[getFilenames] Files to cache: ");
        console.log(fnames);
        return fnames;
    }

}])

.service('$tilecache', ['$vpApi', '$formstack', '$timeout', function($vpApi, $formstack, $timeout){
    /*
    Handles tiles caching.
    */
    var obj = this;
    this.regions = [];
    this.cacheTimer = {'start':null, 'stop':null, 'elasped':null};


    this.isCached = function(){
        var rs = localStorage.getItem('tilesCached');
        var out = (rs === 'true') ? true : false;
        return out;

    }
    this.getMaxCacheZoom = function(){
        /*
        returns the options.maxCacheZoom from the first map-form it finds in forms.
        */
        var out;
        var fs = $vpApi.getFormstack();
        var mapForm = _.find(fs.forms, function(form){
            return (form.type === 'map-form');
        })

        if (mapForm) {
            out =  mapForm.options.maxCacheZoom;
        } else {
            out =  null;
        }
        return out;
    }

    this.getRegions = function(){
        /*
        Look for forms with Regions.
        Returns the list of regions or an empty list.
        */
        var out = [];
        var fs = $vpApi.getFormstack();

        _.each(fs.forms, function(form){
            if (form.type === 'map-form' && form.options.regions) {
                out = _.uniq( out.concat(form.options.regions) );
            }
        });
        obj.regions = out;
        return out;
    }

    this.getTileSources = function(){
        /*
        Look for forms with regions.
        Returns the list of regions or an empty list.
        */

        var out = [];
        var fs = $vpApi.getFormstack();

        _.each(fs.forms, function(form){
            if (form.type === 'map-form' && form.options.tileSources) {
                out = _.uniq( out.concat(form.options.tileSources) );
            }
        });
        obj.tileSources = out;
        return out;
    }

    this.loadRegions = function(onSuccess, onError){
        if (obj.regions.length === 0) {
            obj.getRegions();
            if (obj.regions.length === 0);
            return
        }
        var maxZoom = obj.getMaxCacheZoom();
        var nbTiles = obj.offlineLayer.calculateNbTiles(maxZoom, obj.regions);

        console.log("Will be saving: " + nbTiles + " tiles")
        obj.offlineLayer.saveRegions(obj.regions, maxZoom, 
          function(){
            console.log('[saveRegions] onStarted');
          },
          function(){
            console.log('[saveRegions] onSuccess');
            obj.cacheTimer.stop = new Date();
            obj.cacheTimer.elasped = obj.cacheTimer.stop - obj.cacheTimer.start;
            console.log("Cache timer elapsed time (min): " + obj.cacheTimer.elasped/1000/60)

            localStorage.setItem('tilesCached', 'true');
            onSuccess();
          },
          function(error){
            console.log('onError');
            console.log(error);
            onError();
          })

    } // end loadRegions.

    this.run = function(success, error){
        obj.cacheTimer.start = new Date();
        // These need to be passed in from form.options
        // var mapquestUrl = 'http://{s}.mqcdn.com/tiles/1.0.0/osm/{z}/{x}/{y}.png'
        // var subDomains = ['otile1','otile2','otile3','otile4']
        // var mapquestAttrib = 'Data, imagery and map information provided by <a href="http://open.mapquest.co.uk" target="_blank">MapQuest</a>, <a href="http://www.openstreetmap.org/" target="_blank">OpenStreetMap</a> and contributors.'

        var tileSource = obj.getTileSources()[0];
        onError = function(errorType, errorData1, errorData2){
            /*
                Fires when $tilecache errors out during tile caching.
            */
            console.log("[$tilecache.run.onError()] ");
            localStorage.setItem('tilesCached', 'false');
            console.log(errorType)
            console.log(errorData1)
            console.log(errorData2)
            error();
        }

        // Initalize a map
        var map = L.map('cache-map').setView([-2.9, -79], 13);
        var options = {
            map: map,
            maxZoom: obj.getMaxCacheZoom(),
            attribution: tileSource.attrib,
            dbOnly: true, 
            onReady: function(){console.log("onReady for what?")}, // Not sure what these do
            onError: function(){console.log("onError for what?")},  // Not sure what this does
            storeName:tileSource.storeName,  // this is the objectStore name.
            dbOption:"IndexedDB" // "WebSQL"
        }
        obj.offlineLayer = new OfflineLayer(tileSource.url, options);
        $timeout(function(){
            obj.loadRegions(success, error);
        }, 1000);

    };

    this.clearTiles = function(){
        /*
        Depracted 1/11/2015. Do not use
        */
        console.log('clearing tiles...');
        obj.offlineLayer.clearTiles(
            function(){
                console.log('[clearTiles] success')
            },function(error) {
                console.log('[clearTiles] fail')
            }
        );
    }

    this.clearTilesDb = function(callback){
        /*
        Use this to clear the tiles database from indexedDB
        */

        tilesSources = obj.getTileSources();

        osTableName = tilesSources[0].storeName;
        dbName = "IDBWrapper-" + osTableName;

        var openRequest = window.indexedDB.open(dbName, 1); //version used
        openRequest.onerror = function (e) {
            console.log("[openTilesDb] Database error: " + e.target.errorCode);
        };
        openRequest.onsuccess = function (event) {

            window.db = openRequest.result;
            console.log("[openTilesDb] Opened "+dbName+" with dataStores");
            console.log(window.db.objectStoreNames);

            var store = window.db.transaction(osTableName, "readwrite").objectStore(osTableName);

            store.clear().onsuccess = function (event) {
                localStorage.removeItem("tilesCached");
                console.log('Finished clearing records');
                callback(event);
            };
        };
    };
}])
/*
Github Repo: https://github.com/point97/p97-angular-components.git
Version: v15.01.15a

*/

angular.module('vpApi.services')

.service( '$sync', ['$rootScope', '$http', 'config', '$vpApi', function($rootScope, $http, config, $vpApi) {

    var obj = this;
    this.collections = ['fsResp', 'formResp', 'blockResp', 'answer'];
    this.lastUpdate = localStorage.getItem('lastUpdate');
    
    if (this.lastUpdate) {
        this.lastUpdate = new Date(this.lastUpdate);
    }

    this.run = function(callback){
        var res, fsResps, answers, changes;
        var index = 0;
        changes = obj.getChanges();
        if (changes.length === 0) {
            callback([{'status':'', 'data':'No changes found'}]);
            return;
        }


        errors = [];

        OnSucess = function(data, status) {
            console.log('[$sync.run.OnSucess]');
            if (index === changes.length-1) {
                callback(errors);
            } else {
                index++;
                obj.syncResponse(changes[index], OnSucess, OnError);
            }
            
            
        };

        OnError = function(data, status) {
            console.log('[$sync.run.OnError]');
            if (index === changes.length-1) {
                callback(errors);
            } else {
                index++;
                errors.push({'status':status, 'data':data});
                obj.syncResponse(changes[index], OnSucess, OnError);
            }
        };
        this.syncResponse(changes[index], OnSucess, OnError);

        
    };

    this.syncResponse = function(resp, onSucess, onError) {
        var method, reource;

        if (resp.operation === 'I') method = 'POST'
        if (resp.operation === 'U') method = 'PUT'
        if (resp.operation === 'D') method = 'DELETE'

        debugger
        if (resp.name === 'fsResp' || resp.name === 'formResp' || resp.name === 'blockResp') {
            resource = "pforms/response";
        } else if (resp.name === 'answer') {
            resource = 'pforms/answer';
        } else {
            console.error("[$sync.syncResponse()] Invalid resource name" + resp.name);
        }
        
        resp.obj.formstack = resp.obj.fsId;
        resp.obj.reporter = $vpApi.user.profile.user;
        resp.obj.org = $vpApi.user.profile.orgs[0].id;
        delete resp.obj.meta;
        $vpApi.post(resource, resp.obj, onSucess, onError);
    };

    this.run2 = function(callback){
        var res, fsResps, answers, changes;
        
        changes = obj.getChanges();

        errors = [];

        // Sort into nested structure starting with fsResp --> formResp -->


        // First sync fsResp's
        fsResps = _.find(changes, function(item){return item.name === 'fsResp'});
        answers = _.find(changes, function(item){return item.name === 'answers'});

        fsOnSucess = function(data, status) {
            this.syncResponse()
        };

        fsOnError = function(data, status) {
            console.log('[fsOnError]')
        };

        this.syncResponse(fsResps.changes, fsOnSucess, fsOnError);

        callback(res);
    };

    this.syncResponse2 = function(changes, onSucess, onError) {
        /*
            Sync individual resources.

            Params:
            - resource: [String] the resrouceendpoint, e.g. pforms/response
            - changes: [Object] The loki changes output
        */
        var resource = 'pforms/response';
        var count = 0;
        _.each(changes, function(resp){
            if (resp.operation === 'I'){
                sucess = function(data, status){
                    onSucess(data, status);
                    count++;
                }

                fail = function(data, status){
                    console.error(status);
                    onError(data, status);
                    count++;
                }

                resource = "pforms/response";
                
                resp.obj.formstack = resp.obj.fsId;
                resp.obj.reporter = $vpApi.user.profile.user;
                resp.obj.org = $vpApi.user.profile.orgs[0].id;
                delete resp.obj.meta;
                debugger;
                $vpApi.post(resource, resp.obj, sucess, fail);
            }
        });
    }


    this.getChanges = function(){
        /*
        Get the items that need to be uploaded to the server.

        Items include fsResp, formResp, blockResp, answer

        changes items will have keywords
        - name
        - operation: "I", "U", "D"
        - obj 

        */
        


        var changes;
        var out = [];
        changes = $vpApi.db.serializeChanges(obj.collections);
        return JSON.parse(changes);

        _.each(this.collections, function(colName){
            changes = $vpApi.db.serializeChanges([colName]);
            changes = JSON.parse(changes);
            console.log(colName);
            console.table(changes);
            out.push({'name':colName, 'changes':changes});
        });

        return out;
    };
}]);
