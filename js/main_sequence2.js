//function to instantiate the Leaflet map
function createMap(){
    
    //create the map
    var map = L.map('mapid').setView([47, 1.673078133], 5);

    //add base tilelayer
    L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
        attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
        maxZoom: 18,
        id: 'mapbox.light',
        accessToken: 'pk.eyJ1Ijoiam1qZmlzaGVyIiwiYSI6ImNqYXVlNDg3cDVhNmoyd21oZ296ZXpwdWMifQ.OGprR1AOquImP-bemM-f2g'
    }).addTo(map);

    //call getData function
    getData(map);
};

//Above Example 3.8...Step 3: build an attributes array from the data
function processData(data){
    //empty array to hold attributes
    var attributes = [];

    //properties of the first feature in the dataset
    var properties = data.features[0].properties;

    //push each attribute name into attributes array
    for (var attribute in properties){
        //only take attributes with population values
        if (attribute.indexOf("Season") > -1){
            attributes.push(attribute);
        };
    };

    //check result
    console.log(attributes);

    return attributes;
};

//Create new sequence controls IN MAP
function createSequenceControls(map, attributes){   
    var SequenceControl = L.Control.extend({
        options: {
            position: 'bottomleft'
        },

        onAdd: function (map) {
            // create the control container div with a particular class name
            var container = L.DomUtil.create('div', 'sequence-control-container');

            // ... initialize other DOM elements, add listeners, etc.
            
            $(container).append('<button class="skip" id="reverse" title="Reverse">Back</button>');       
            $(container).append('<input class="range-slider" type="range">');
            $(container).append('<button class="skip" id="forward" title="Forward">Next</button>');
            
            $(container).on('mousedown dblclick', function(e){
                L.DomEvent.stopPropagation(e);
            });
            
            return container;
        }
    });

    map.addControl(new SequenceControl());
    addSequencing(map,attributes);
};

//calculate radius of each symbol based on total max/min values, max radius of 75 for entire dataset
function calcPropRadiusJM(attValue) {
    var radius = 5+((attValue-4.5)/319.8)*85;
    return radius;
};

//adds event listeners to slider and buttons after created in createSequenceControls
function addSequencing(map,attributes){
    $('.range-slider').attr({   
        max: 9,
        min: 0,
        value: 0,
        step: 1
    });

    $('.skip').click(function() {
        //get the old index value
        var index = $('.range-slider').val();

        //increment or decrement depending on button clicked
        if ($(this).attr('id') == 'forward'){
        index++;
        //if past the last attribute, wrap around to first attribute
        index = index > 9 ? 0 : index;
        console.log(index);
        } else if ($(this).attr('id') == 'reverse'){
        index--;
        //if past the first attribute, wrap around to last attribute
        index = index < 0 ? 9 : index;
        console.log(index);
        };

        //update slider
        $('.range-slider').val(index);
        updatePropSymbols(map, attributes[index]);
        liveUpdatePanel(attributes[index]);
        updateLegend(map,attributes[index]);
    });

    $('.range-slider').on('input', function() {
        var index = $(this).val();
        console.log(index);
        updatePropSymbols(map, attributes[index]);
        liveUpdatePanel(map,attributes[index]);
        updateLegend(map,attributes[index]);

    });
};

function liveUpdatePanel(map,spot){
    console.log(spot);
    $('#team-area').html("");
};

//function to convert markers to circle markers
function pointToLayer(feature, latlng, attributes){
    
    //Determine which attribute to visualize with proportional symbols
    var attribute = attributes[0];

    //create marker options
    var options = {
        fillColor: "#5BA75B",
        color: "#000",
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8
    };

    //For each feature, determine its value for the selected attribute
    var attValue = Number(feature.properties[attribute]);

    //Give each feature's circle marker a radius based on its attribute value
    options.radius = calcPropRadiusJM(attValue);

    //create circle marker layer
    var layer = L.circleMarker(latlng, options);
    
    createPopup(feature.properties, attribute, layer, options.radius);

    //return the circle marker to the L.geoJson pointToLayer option
    return layer;
};

//Add circle markers for point features to the map
function createPropSymbols(data, map, attributes){
    //create a Leaflet GeoJSON layer and add it to the map
    L.geoJson(data, {
        pointToLayer: function(feature, latlng){
            return pointToLayer(feature, latlng, attributes);
        }
    }).addTo(map);
};
    
//function to retrieve the data and place it on the map
function getData(map){
    //load the data
    $.ajax("data/transfers.geojson", {
        dataType: "json",
        success: function(response){

            var attributes = processData(response);
            console.log("here are the attributes: " + attributes);
            
            createPropSymbols(response, map, attributes);
            createSequenceControls(map, attributes);
            createLegend(map, attributes);
        }
    });
};

//Step 10: Resize proportional symbols according to new attribute values
function updatePropSymbols(map, attribute){
    map.eachLayer(function(layer){

        if (layer.feature && layer.feature.properties[attribute]){
        //access feature properties
        var props = layer.feature.properties;

        //update each feature's radius based on new attribute values
        var radius = calcPropRadiusJM(props[attribute]);
        layer.setRadius(radius);
            
        createPopup(props, attribute, layer, radius);
        
        };
    });
};

function createPopup(properties, attribute, layer, radius){
    
    //add team to popup content string
    var popupContent = "<p class=\"hover-team\"><b>" + properties.Team + "</b></p>";

    //add formatted attribute to panel content string
    var crest = "<img class=\"crest\" src=img/" + String(properties.Rank) + ".svg />";
    var teamText = "<h2>" + properties.Team + "</h2>"
    var locationText = "<p><b>Location</b>: " + properties.City + ", " + properties.Country + "</p>";
    var rankText = "<p><b>2017 Forbes Value Rank</b>: " + properties.Rank + "</p>";
    var season = attribute.split("_")[1];
    var seasonSpend = "<p><b>" + season + " Transfer Fees</b>: &euro;" + properties[attribute] + "MM</p>";
    
    var panelContent = crest + teamText + locationText + rankText + seasonSpend;

    //replace the layer popup
    layer.bindPopup(popupContent, {
        offset: new L.Point(0,-radius)
    });
    
    layer.on({
    mouseover: function(){
        this.openPopup();
    },
    mouseout: function(){
        this.closePopup();
    },
    click: function(){
        $('#team-area').html(panelContent);
    }
    });
};

function createLegend(map, attributes){
    var LegendControl = L.Control.extend({
        options: {
            position: 'bottomleft'
        },

        onAdd: function (map) {
            // create the control container with a particular class name
            var container = L.DomUtil.create('div', 'legend-control-container');

            //add temporal legend div to container
            $(container).append('<div id="temporal-legend">')

            //Step 1: start attribute legend svg string
            var svg = '<svg id="attribute-legend" width="350px" height="185px">';
            
            //array of circle names to base loop on
            //var circles = ["max", "mean", "min"];
            var circles = {
                max: 80,
                mean: 120,
                min: 160
            }
            
            //Step 2: loop to add each circle and text to svg string
            for (var circle in circles){
                //circle string
                svg += '<circle class="legend-circle" id="' + circle + 
                '" fill="#5BA75B" fill-opacity="0.8" stroke="#000000" cx="92"/>';
                
                svg += '<text id="' + circle + '-text" x="200" y="' + circles[circle] + '"></text>';
            };
            
            svg += "</svg>";

            //add attribute legend svg to container
            $(container).append(svg);

            return container;
        }
    });

    map.addControl(new LegendControl());

    updateLegend(map, attributes[0]);
};

//Update the legend with new attribute
function updateLegend(map, attribute){
    //create content for legend
    var year = attribute.split("_")[1];
    var content = year + " Season";

    //replace legend content
    $('#temporal-legend').html("<b>"+content+"</b>");
    
    var circleValues = getCircleValues(map, attribute);

    for (var key in circleValues){
        //get the radius
        var radius = calcPropRadiusJM(circleValues[key]);

        //Step 3: assign the cy and r attributes
        $('#'+key).attr({
            cy: 182 - radius,
            r: radius
        });
        
        $('#'+key+'-text').html("&euro;" + Math.round(circleValues[key]*100)/100 + " million");
    };
};

//Calculate the max, mean, and min values for a given attribute
function getCircleValues(map, attribute){
    //start with min at highest possible and max at lowest possible number
    var min = Infinity,
        max = -Infinity;

    map.eachLayer(function(layer){
        //get the attribute value
        if (layer.feature){
            var attributeValue = Number(layer.feature.properties[attribute]);

            //test for min
            if (attributeValue < min){
                min = attributeValue;
            };

            //test for max
            if (attributeValue > max){
                max = attributeValue;
            };
        };
    });

    //set mean
    var mean = (max + min) / 2;

    //return values as an object
    return {
        max: max,
        mean: mean,
        min: min
    };
};

$(document).ready(createMap);