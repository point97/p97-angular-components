angular.module('p97.questionTypes')  // All p97 components should be under p97.
  .directive('mapMultiSelect', ['$http', '$templateCache', '$compile', '$sce', '$timeout', function($http, $templateCache, $compile, $sce, $timeout){  // question-type directives should be the nameof the question type as defined in the Viewpoint API.


    return {
        template: '',
        restrict: 'EA',

        // Scope should always look like this in all question types.
        scope: {
            question: '=',
            value: '=',
            control: '='
        },
        link: function(scope, element, attrs) {
            if (!scope.question) return;
            var options = scope.question.options;

            /*
            scope.selectedFeature naming convention was kept consistent
            so that onEachFeature function would be as 'DRY' as possible
            */
            if (options.type === 'featureCollection') {

               scope.geoCollection = {
                    'type:': 'FeatureCollection',
                    'features': []
                }
                scope.selectedFeatures = scope.geoCollection.features;
            } else {
                scope.selectedFeatures = [];
            }

            scope.getContentUrl = function() {
                if(scope.question.options.widget)
                    return BASE_TEMPLATE_URL+'map-multi-select/templates/'+scope.question.options.widget+'.html';
                else
                    return BASE_TEMPLATE_URL+'map-multi-select/templates/'+platform+'/map-multi-select.html';
            }

            scope.renderHtml = function(htmlCode) {
                return $sce.trustAsHtml(htmlCode);
            };

            isInteger = function (x) {
                if (x === "") {
                    return false;
                };
                
                y = parseInt(x, 10);
                return (typeof y === 'number') && (x % 1 === 0);
            }

            function onEachFeature(feature, layer) {
               var geojsonOptions = options.geojsonChoices;
               layer.on('click', function (e) {

                    if (options.type === 'featureCollection') {
                        var grid = e.target.feature;
                    } else {
                        var grid = e.target.feature.properties.id;
                    }

                    var isSelected = _.contains(scope.selectedFeatures, grid);

                    if (isSelected){
                        // If it is in selected feature, remove it.
                        layer.setStyle( {
                            fillOpacity: geojsonOptions.style.fillOpacity,
                        });
                        index = _.indexOf(scope.selectedFeatures, grid);
                        scope.selectedFeatures.splice(index, 1);
                    } else {
                        layer.setStyle( {
                            //clickStyle allows for geojson to be one color, while fills being another
                            color: geojsonOptions.style.color,
                            fillColor: geojsonOptions.clickStyle.fillColor,
                            fillOpacity: geojsonOptions.clickStyle.fillOpacity
                        });
                        scope.selectedFeatures.push(grid);
                        if (isInteger(grid)) {
                            scope.selectedFeatures.sort(function(a, b){return a-b});
                        };
                    }
                    scope.$apply(function () {
                        if (options.type === 'featureCollection' && scope.selectedFeatures.length > 0) {
                            /*
                            geoCollection is the entire featureCollection
                            while selectedFeatures are the individual feature objects within
                            */
                            scope.value = scope.geoCollection;
                        } else if (scope.selectedFeatures.length > 0) {
                            scope.value = scope.selectedFeatures
                        } else {
                            scope.value = ""
                        }
                    });
                });
            };

            // This is availible in the main controller.
            scope.internalControl = scope.control || {};

            scope.internalControl.validate_answer = function(){
                scope.errors = []

                if (options.required && options.required === true && scope.value.length === 0) {
                    scope.errors.push("A location is required.");
                }
                return (scope.errors.length === 0);
            };

            scope.internalControl.clean_answer = function(){

            };

            // Compile the template into the directive's scope.
            $http.get(scope.getContentUrl(), { cache: $templateCache }).success(function(response) {
                var contents = element.html(response).contents();
                $compile(contents)(scope);

                scope.map = L.map('map').setView(options.initial.center, options.initial.zoom);

                var baseLayers = {};
                var layer = {};
                var layersArray = [];
                var tileSources = options.tileSources;

                _.each(tileSources, function(tileSource) {

                    //add tile layer(s)
                    var mapOptions = {
                        maxZoom: tileSource.maxZoom,
                        attribution: tileSource.attrib,
                        dbOnly: false,
                        onReady: function(){},
                        onError: function(){},
                        storeName: tileSource.storeName,
                        subdomains: tileSource.subdomain,
                        dbOption: "IndexedDB" // "WebSQL"
                    }

                    //TODO - OFFLINE TILE CACHING

                    if (tileSource.name !== "NOAA Nautical Charts" && tileSource.name !== "Bing") {

                        layer = L.tileLayer(tileSource.url, mapOptions);
                        var key = tileSource.name;
                        baseLayers[key] = layer;

                        //only a single layer can/should be added to scope.map
                        //this creates an array, where the first index can be grabbed within the timeout function
                        layersArray.push(layer)
                    };

                    if (tileSource.name === 'Bing') {
                        var bing = new L.BingLayer("Av8HukehDaAvlflJLwOefJIyuZsNEtjCOnUB_NtSTCwKYfxzEMrxlKfL1IN7kAJF", {
                            //can be 'Roads', 'Aerial' or 'AerialWithLabels'
                            type: tileSource.type || "AerialWithLabels"
                        });
                        baseLayers[tileSource.name] = bing;
                        layersArray.push(bing);
                    };

                    // NOAA tiles are NOT to be cached, as users are not accepting acknowledgement of usage prior to using leaflet.
                    // Complete User Agreement can be seen here: http://www.nauticalcharts.noaa.gov/mcd/Raster/download_agreement.htm
                    if (tileSource.name === 'NOAA Nautical Charts') {
                        var nautical = new L.tileLayer.wms("http://seamlessrnc.nauticalcharts.noaa.gov/arcgis/services/RNC/NOAA_RNC/ImageServer/WMSServer", {
                            format: 'img/png',
                            transparent: true,
                            layers: null,
                            attribution: "Tiles Courtesy of <a href=\"http://www.nauticalcharts.noaa.gov/csdl/seamlessraster.html\">NOAA &reg;</a> &mdash; <a href=\"http://www.nauticalcharts.noaa.gov/mcd/Raster/download_agreement.htm\">User Agreement</a> "
                        });
                        baseLayers[tileSource.name] = nautical;
                        layersArray.push(nautical);
                    };
                });

                $timeout(function(){
                    //grabs the first object in the array
                    layersArray[0].addTo(scope.map);
                    if (baseLayers.length > 1) {
                        L.control.layers(baseLayers).addTo(scope.map)
                    };
                });

                if (options.hasOwnProperty('geojsonChoices')) {
                    $http.get(options.geojsonChoices.path).success(function(data, status) {
                        var geojsonLayer = new L.geoJson(data,
                        {
                            style: options.geojsonChoices.style,
                            onEachFeature: onEachFeature
                        });
                    geojsonLayer.addTo(scope.map).bringToFront();
                    });
                };
            });

        }
    }
}]);