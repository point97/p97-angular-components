
angular.module('survey.services', [])

.factory('$formUtils', ['$vpApi', '$location','$formstack', '$formResp', function($vpApi, $location, $formstack, $formResp) {
    var obj = this;

    var VERBOSE = false;
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
        var fsSlug = null;
        if(stateParams && stateParams.fsSlug){
            fsSlug = stateParams.fsSlug;
        }
        // Getting loki Collection for queries
        scope.formstack = $vpApi.getFormstack(fsSlug);
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
            scope.current.fsResp = scope.fsResps.find({id:stateParams.fsRespId})[0];
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
            // if ($location.hash().length === 0){
            //     $location.hash("intro");
            // }
            $location.hash('intro'); // Also go to intropage on load.
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
            scope.mapQuestion = scope.current.block.questions[0];
            scope.mapQuestion.value = ""; // Clear the value of th map question.
            _.each(scope.current.block.questions, function(q){
                q.form = {show:false};
            });

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
                /************** FOR EACH AND FOR EACH ANSWER STUFF *******************/
                var ans = _getAnswer(scope, scope.current.form.options.forEachAnswer, scope.current.fsRespId);
                var verbose;
                scope.forEach = [];
                _.each(ans.value, function(val){
                    // TODO Look up verbose value from question.choices.
                    //verbose = _.find(question.choices, function(choice){return(choice.value === val);}) || val;
                    scope.forEach.push({'verbose': val, 'value':val});
                });
            

            } else if (scope.current.form.blocks[0].options.repeatable) {
                /************** REPEATABLE BLOCK STUFF *******************/
                // get or create formResp
                var formResps = scope.formResps.chain()
                    .find({'fsRespId': scope.current.fsResp.id}) // There should only be one form response for a given item.
                    .find({'formId': scope.current.form.id})
                    .data();

                // A get or create on formResp and set item.formResp 
                if (formResps.length === 0) {
                    scope.current.formResp = scope.formResps.insert({
                        'fsSlug':scope.formstack.slug,
                        'fsRespId': scope.current.fsResp.id,
                        'formId': scope.current.form.id,
                        'formIndex': scope.current.formIndex,
                        'formRepeatItem':null,
                        'client_created': $vpApi.getTimestamp(),
                        'client_updated': $vpApi.getTimestamp()
                    });
                    $vpApi.db.save()
                } else {
                    scope.current.formResp = formResps[0];
                }

                scope.current.form.blockResps = scope.blockResps.chain()
                    .find({'fsRespId': scope.current.fsResp.id})
                    .find({'formId': scope.current.form.id})
                    .data();
            } else {
                //****************** DEFAULT FORM STUFF *************************/
                // get or create formResp
                var formResps = scope.formResps.chain()
                    .find({'fsRespId': scope.current.fsResp.id}) // There should only be one form response for a given item.
                    .find({'formId': scope.current.form.id})
                    .data();

                // A get or create on formResp and set item.formResp 
                if (formResps.length === 0) {
                    scope.current.formResp = scope.formResps.insert({
                        'fsSlug':scope.formstack.slug,
                        'fsRespId': scope.current.fsResp.id,
                        'formId': scope.current.form.id,
                        'formIndex': scope.current.formIndex,
                        'formRepeatItem':null,
                        'client_updated': $vpApi.getTimestamp()
                    });
                    $vpApi.db.save()
                } else {
                    scope.current.formResp = formResps[0];
                }

                // Look for block Resp
                var blockResps = scope.blockResps.chain()
                    .find({'fsRespId': scope.current.fsResp.id}) // There should only be one form response for a given item.
                    .find({'formRespId': scope.current.formResp.id})
                    .find({'blockId': scope.current.block.id})
                    .data();

                if (blockResps.length > 0){
                    scope.current.blockResp = blockResps[0];
                }
                
            }



        } else if (state.current.name === 'app.form-foreach') {
           /*
            forEach form case.
            Sets:
            scope.current.form
            scope.current.formIndex

            scope.current.page
            */

            scope.current.form = _.find(scope.formstack.forms, function(form){
                return (form.id === stateParams.formId);
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

                scope.current.formResp = scope.formResps.find({id:stateParams.formRespId})[0];
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

                scope.current.blockResp = scope.blockResps.find({id:stateParams.blockRespId})[0] ;
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

        // Set the forEachItem
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
        var fsSlug = null;

        var blocks = $scope.current.form.blocks; // This will go away completely, just need to defined _getPrevEligibleBlock().

        if($state && $state.params && $state.params.fsSlug){
            fsSlug = $state.params.fsSlug;
        }

        getAnswer = function(qSlug){
            /*
            A shortcut function to make survey authoring a little easier. You can
            can this from options.skipWhen or options.repeat_count, etc...

            */

            fsRespId = $scope.current.fsResp.id;
            answers = $vpApi.db.getCollection('answer');
            var ans = $vpApi.db.getCollection('answer').chain()
                .find({'questionSlug':qSlug})
                .find({'fsRespId': fsRespId})
                .data();

            if (ans.length > 1){
                console.warn("[getAnswer()] found more than one answer, returns the first one.");
                console.table(ans);
                ans = ans[0];
            } else if (ans.length === 1){
                ans = ans[0];
            } else {
                ans = null;
                console.error("[]getAnswer] No answer found");
            }
            if (VERBOSE) console.log('Found answer: ' + ans );
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
                if (VERBOSE) console.log('[LinearBlockCtrl.saveBlock()] found next block, setting state');

                // Get the an already existing blockResp or make a new one
                var blockRespId, page;
                if (action === 'forward') {
                    formRespId = $scope.current.formResp.id;
                    var blockResps = $scope.blockResps
                        .chain()
                        .find({'blockId':nextBlock.id})
                        .find({'formRespId':$scope.current.formResp.id})
                        .data();

                    if (blockResps.length > 0) {
                        blockRespId = blockResps.slice(-1)[0].id; // Grab the last one.
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
                        $location.hash([$scope.current.formResp.id, blockRespId, 0].join("/"));
                        return;
                    } else {
                        formRespId = $scope.current.formResp.
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
                    'fsRespId': $scope.current.fsResp.id,
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
                if (VERBOSE) console.log('[LinearBlockCtrl.saveBlock()] No more blocks in this form, so grabbing the first block of the next form');
                //nextForm = $scope.formstack.forms[$scope.current.formIndex + 1];
                var nextFormRespId, nextBlock, nextBlockRespId;
                var nextForm = this.getEligibleForm(action, $scope.current.formIndex, fsSlug);
                if (nextForm){
                    newState += (nextForm.type) ? nextForm.type : 'form';
                    
                    // Send them to the first formResp created if found.
                    formResps = $scope.formResps.chain()
                        .find({'fsRespId':$scope.current.fsResp.id})
                        .find({'formId': nextForm.id})
                        .simplesort('created')
                        .data();

                    if (formResps.length > 0){
                        nextFormRespId = formResps[0].id;

                    } else {
                        nextFormRespId = 'new-' + nextForm.id;
                    }

                    nextBlock = getEligibleBlock('forward', nextForm, -1);
                    
                    if(nextBlock.forEach){
                        // TODO
                        console.error("Not implemented")
                        debugger;
                    } else {
                        // Send them to the first blockResp created if found.
                        blockResps = $scope.blockResps.chain()
                            .find({'fsRespId':$scope.current.fsResp.id})
                            .find({'formRespId': nextFormRespId})
                            .find({'blockId': nextBlock.id})
                            .simplesort('$loki',false)
                            .data();

                        if (blockResps.length > 0){
                            nextBlockRespId = blockResps[0].id;
                        } else {
                            nextBlockRespId = 'new-' + nextBlock.id;
                        }
                    }

                    
                    if(nextForm.options.forEach || nextForm.options.forEachAnswer){
                        newState += "-foreach";
                        newHash = 'intro'; // This is used be the map-form

                    }
                    newStateParams = {
                        'fsSlug': $scope.formstack.slug,
                        'fsRespId': $scope.current.fsResp.id,
                        'formId': nextForm.id,
                        'formRespId': nextFormRespId,
                        'blockRespId': nextBlockRespId,
                        'hash': newHash, // This is used by map-form-foreach
                        'page': newHash, // This is used by form-foreach
                        'qIndex': 'intro'
                    }
                    $state.go(newState, newStateParams);
                    return;

                } else {
                    if (VERBOSE) console.log('[LinearBlockCtrl.saveBlock()] No more forms. You are done.');
                    // Update the fsResp

                    $scope.current.fsResp.status = 'complete';
                    $scope.current.fsResp.client_updated = $vpApi.getTimestamp();
                    $vpApi.db.save();

                    if (VERBOSE) console.log('[LinearBlockCtrl.saveBlock()] No more forms. You are done.');
                    $state.go('app.complete', {'fsRespId':$scope.current.fsResp.id});  // Use $state.go here instead of $location.path or $location.url
                    return;
                }
            }

        } else if (action === 'back'){
            // See if there is a previous block
            prevBlock = this.getEligibleBlock(action, $scope.current.form, $scope.current.blockIndex);

            if (prevBlock){

                if (VERBOSE) console.log('[LinearBlockCtrl.saveBlock()] found next block');

                // Get the last blockResp
                //var prevBlockResps = $scope.blockResps.find({blockId:prevBlock.id})
                var prevBlockResps = $scope.blockResps.chain()
                    .find({blockId:prevBlock.id})
                    .find({formRespId:$scope.current.formResp.id})
                    .data();

                if (prevBlockResps.length > 0){
                    prevBlockResp = prevBlockResps.slice(-1)[0];
                } else {
                    prevBlockResp = {'id':'new-'+prevBlock.id};
                }

                newState += ($scope.current.form.type) ? $scope.current.form.type : 'form';
                newStateParams = {
                    'fsSlug': $scope.formstack.slug,
                    'fsRespId': $scope.current.fsResp.id,
                    'formRespId': $scope.current.formResp.id,
                    'blockRespId': prevBlockResp.id,
                    'hash': newHash
                }
            } else {
                if (VERBOSE) console.log('[LinearBlockCtrl.saveBlock()] This is the first block in the form');
                //prevForm = $scope.formstack.forms[$scope.current.formIndex - 1];

                prevForm = this.getEligibleForm(action, $scope.current.formIndex, fsSlug);
                if (prevForm){
                    if (VERBOSE) console.log('[LinearBlockCtrl.saveBlock()] Found prev form');

                    // Get the last form response
                    var prevFormResp = $scope.formResps
                        .chain()
                        .find({fsRespId: $scope.current.fsResp.id})
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
                        .find({formRespId:prevFormResp.id})
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
                        'fsRespId': $scope.current.fsResp.id,
                        'formRespId': prevFormResp.id,
                        'formId': prevForm.id, // This is needed for map-form and map-form-foreach
                        'blockRespId': prevBlockResp.id,
                        'hash': page,
                        'page': page
                    }

                } else {
                    if (VERBOSE) console.log('[LinearBlockCtrl.saveBlock()] No more forms. You are done.');
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

        fsRespId = fsRespId || scope.current.fsResp.id;

        answers = $vpApi.db.getCollection('answer');
        var ans = $vpApi.db.getCollection('answer').chain()
            .find({'questionSlug':qSlug})
            .find({'fsRespId': fsRespId})
            .data();

        if (ans.length > 1){
            if (VERBOSE) console.log("found more than one answer, returns the first one.");
            console.table(ans);
            ans = ans[0];
        } else if (ans.length === 1){
            ans = ans[0];
        } else {
            ans = null;
        }
        if (VERBOSE) console.log('Found answer: ' + ans );
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
            if (VERBOSE) console.log("[findEligibleNextBlock] looking for blockIndex " + currentBlockIndex);

            if (direction === 'forward') {
                block = blocks[currentBlockIndex + 1];
            }else {
                block = blocks[currentBlockIndex - 1];
            }

            if (block){
                if (typeof(block.options.skipWhen) !== 'undefined'){
                    rs = eval(block.options.skipWhen);

                    if (rs){
                        if (VERBOSE) console.log('[_getNextBlock()] I need to skip this block and get the next one');

                        if (direction === 'forward'){
                            // Increase index by 1
                            currentBlockIndex++;
                        } else {
                            currentBlockIndex--;
                        }

                        findEligibleBlock(direction);
                        //
                    } else {
                        if (VERBOSE) console.log('[_getNextBlock()] I can use this block.');
                    }
                } // End if skipWhen
            } else {
                if (VERBOSE) console.log("[_getNextBlock] there are no more blocks on this form" );
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
                .find({'fsRespId': scope.current.fsResp.id}) // There should only be one form response for a given item.
                .find({'formId': scope.current.form.id})
                .find({'formRepeatItem': item.value})
                .data();

            // A get or create on formResp and set item.formResp
            if (item.formResp.length === 0) {
                if (VERBOSE) console.log("Create a formResp for " + item);
                item.formResp = scope.formResps.insert({
                    'fsSlug':scope.formstack.slug,
                    'fsRespId': scope.current.fsResp.id,
                    'formId': scope.current.form.id,
                    'formIndex': scope.current.formIndex,
                    'formRepeatItem':item.value,
                    'formForEachItem':item.value,
                    'formForEachQuestionSlug': scope.current.form.options.forEachAnswer,
                    'client_created': $vpApi.getTimestamp(),
                    'client_updated': $vpApi.getTimestamp()
                });
                $vpApi.db.save()
            } else {
                item.formResp = item.formResp[0];
            }

            // Get the block responses.
            item.blockResps = scope.blockResps.chain()
                .find({'fsRespId': scope.current.fsResp.id}) // There should only be one form response for a given item.
                .find({'formRespId': item.formResp.id})
                .simplesort('created')
                //.find({'formForEachItem': item.value})
                //.simplesort('created', false)
                .data()
            if (item.blockResps.length > 0) {
                item.formRespId = item.blockResps[0].formRespId;
                item.blockRespId = item.blockResps[0].id;
                item.isNew = false;
            } else {
                item.formRespId = "new-" + scope.current.form.id;
                item.blockRespId = "new-" + scope.current.form.blocks[0].id;
                item.isNew = true;
            }

            item.form = "form"
        });

        // Removes formResps and children that do not have an item in
        // in current.form.forEach
        var res = scope.formResps.chain()
            .find({'formId': scope.current.form.id})
            .find({'fsRespId': scope.current.fsResp.id})

        // Exclude resps that have forEach items on the forRach array.
        _.each(scope.current.form.forEach, function(item){
            res.find({'formForEachItem': {'$ne': item.value }});
        });

        staleFormResps = res.data();
        if (VERBOSE) console.log("Stale Form Resps");
        console.table(staleFormResps);
        _.each(staleFormResps, function(resp){
            $formResp.delete(resp.id);
        });

    };

    getEligibleForm = function(direction, currentFormIndex, fsSlug) {
        /*
            Checks for repeated form and skipWhen logic.

            Inputs:
            - direction - [String] 'forward', 'back'
            - currentFormIndex - Int
            - fsSlug - the slug of the current formstack (can be null)

            Returns a form or null if no eligilbe form is found on the formstack (i.e. you are done with the survey)
        */

        var forms = $vpApi.getFormstack(fsSlug).forms;

        function findEligibleForm(direction){
            if (VERBOSE) console.log("[findNextEligibleForm] looking for formIndex " + currentFormIndex);
            if (direction === 'forward'){
                form = forms[currentFormIndex + 1];
            } else {
                form = forms[currentFormIndex - 1];
            }
            if (form){
                if (typeof(form.options.skipWhen) !== 'undefined'){
                    rs = eval(form.options.skipWhen);

                    if (rs){
                        if (VERBOSE) console.log('[_findNextEligibleForm()] I need to skip this form and get the next one');

                        if (direction === 'forward') {
                            // Increase index by 1
                            currentFormIndex++;
                        } else {
                            currentFormIndex--;
                        }

                        findEligibleForm(direction);
                    } else {
                        if (VERBOSE) console.log('[_findNextEligibleForm()] I can use this form.');
                    }
                } // End if skipWhen
            } else {
                if (VERBOSE) console.log("[_getNextBlock] there are no more forms on this form" );
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
               .find({'fsRespId': fsRespId})
               .find({'formRespId': formRespId})
               .find({'blockRespId': blockRespId})
               .data();
        };

        // Loop over answers and set defaults
        _.each($scope.current.block.questions, function(q){
            // Get the answer for the question
            var ans = _.find($scope.previousAnswers, function(pans){
                return (pans.questionId === q.id);
            });


            if (ans) {
                q.value = ans.value;
                q.previousValue = ans.value;
                q.answerId = ans.id;
            } else if ( typeof(q.options['default']) !==  'undefined'){
                q.value = q.options['default'];
                q.previousValue = q.options['default'];
                q.answerId = null;
            } else {
                q.value = '';
                q.previousValue = '';
                q.answerId = null;
            }
        });
    };

    // Watch the url for hash changes.
    parseHash = function(raw){
        /*
        Returns 'intro', 'end', or [formRespId, blockRespId, qIndex]
        
        qIndex will always be an integer, formRespId and blockRespId are strings.
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
