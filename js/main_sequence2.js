//function to instantiate the Leaflet map
function createMap(){
    
    //create the map 1.673078133
    var map = L.map('mapid').setView([47.6, -1.7], 5);

    //add base tilelayer
    /*
    L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
        attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a> Transfer Data: <a href="https://www.transfermarkt.com/">Transfermarkt</a> Forbes Ranking: <a href="https://www.forbes.com/forbes/welcome/?toURL=https://www.forbes.com/sites/mikeozanian/2017/06/06/the-worlds-most-valuable-soccer-teams-2017/">Forbes</a>',
        maxZoom: 18,
        id: 'mapbox.light',
        accessToken: 'pk.eyJ1Ijoiam1qZmlzaGVyIiwiYSI6ImNqYXVlNDg3cDVhNmoyd21oZ296ZXpwdWMifQ.OGprR1AOquImP-bemM-f2g'
    }).addTo(map);
    */
    
    L.tileLayer.provider('Stamen.Toner', {attribution:'Map tiles by <a href="https://stamen.com/">Stamen Design</a>, <a href="https://creativecommons.org/licenses/by/3.0/">CC BY 3.0</a> - Map data © <a href="http://openstreetmap.org">OpenStreetMap</a> - Transfer Data <a href="https://www.transfermarkt.com/">Transfermarkt</a> - <a href="https://www.forbes.com/forbes/welcome/?toURL=https://www.forbes.com/sites/mikeozanian/2017/06/06/the-worlds-most-valuable-soccer-teams-2017/">Forbes Ranking</a>'}).addTo(map);
    
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
    return attributes;
};

//Create new sequence controls IN MAP
function createSequenceControls(map, attributes, geodata){   
    var SequenceControl = L.Control.extend({
        options: {
            position: 'bottomleft'
        },

        onAdd: function (map) {
            // create the control container div with a particular class name
            var container = L.DomUtil.create('div', 'sequence-control-container');

            // ... initialize other DOM elements, add listeners, etc.
            
            $(container).append('<img class="skip" id="reverse" src="img/left.svg">');       
            $(container).append('<input class="range-slider" type="range">');
            $(container).append('<img class="skip" id="forward" src="img/right.svg">');
            
            $(container).on('mousedown dblclick', function(e){
                L.DomEvent.stopPropagation(e);
            });
            
            return container;
        }
    });

    map.addControl(new SequenceControl());
    addSequencing(map,attributes,geodata);
};

//calculate radius of each symbol based on total max/min values, max radius of 75 for entire dataset
function calcPropRadiusJM(attValue) {
    var radius = 5+((attValue-4.5)/319.8)*85;
    return radius;
};

//adds event listeners to slider and buttons after created in createSequenceControls
function addSequencing(map,attributes,geodata){

    $('.range-slider').attr({   
        max: 9,
        min: 0,
        value: 9,
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

        } else if ($(this).attr('id') == 'reverse'){
        index--;
        //if past the first attribute, wrap around to last attribute
        index = index < 0 ? 9 : index;
        };

        //update slider
        $('.range-slider').val(index);
        updatePropSymbols(map, attributes[index]);
        updateLegend(map,attributes[index]);
        liveUpdatePanel(attributes[index],geodata);
    });

    $('.range-slider').on('input', function() {
        var index = $(this).val();
        updatePropSymbols(map, attributes[index]);
        updateLegend(map,attributes[index]);
        liveUpdatePanel(attributes[index],geodata);
    });
};

function liveUpdatePanel(spot,geodata){
    
    var teamRankFull = String($('#rank').text());
    var teamRank = Number(teamRankFull.split(": ")[1]);
    var teamSelect = teamRank-1;
    var newValue = geodata["features"][teamSelect]["properties"][spot];
    var season = spot.split("_")[1];
    var newText = "<b>" + season + " Transfer Fees</b>: &euro;" + newValue + "  MM"
    $('#fees').html(newText);
    
};

function fillColoring(e){
    if (e === 1){
        var color = "#DA020E"
        return color;
    } else if (e === 2) {
        var color = "#004D98"
        return color;
    } else if (e === 3) {
        var color = "#FEBE10"
        return color;
    } else if (e === 4) {
        var color = "#EE0A46"
        return color;
    } else if (e === 5) {
        var color = "#5CBFEB"
        return color;
    } else if (e === 6) {
        var color = "#9C824A"
        return color;
    } else if (e === 7) {
        var color = "#034694"
        return color;
    } else if (e === 8) {
        var color = "#D00027"
        return color;
    } else if (e === 9) {
        var color = "000000"
        return color;
    } else if (e === 10) {
        var color = "#001C58"
        return color;
    } else if (e === 11) {
        var color = "#003366"
        return color;
    } else if (e === 12) {
        var color = "#F7B500"
        return color;
    } else if (e === 13) {
        var color = "#E11624"
        return color;
    } else if (e === 14) {
        var color = "#CB3524"
        return color;
    } else {
        var color = "#60223B"
        return color;
    }
};

//function to convert markers to circle markers
function pointToLayer(feature, latlng, attributes){
    
    //Determine which attribute to visualize with proportional symbols
    var attribute = attributes[9];
    //derive rank value to submit to fillColoring function
    var rank = "Rank";
    var ranking = Number(feature.properties[rank]);
    //create marker options
    var options = {
        fillColor: fillColoring(ranking),
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
            var geodata = response;
            
            createPropSymbols(response, map, attributes);
            createSequenceControls(map, attributes, geodata);
            createLegend(map, attributes);
            createSearch(map,geodata);
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
    var teamText = "<h2 id=\"team-name\">" + properties.Team + "</h2>"
    var locationText = "<p><b>Location</b>: " + properties.City + ", " + properties.Country + "</p>";
    var rankText = "<p id=\"rank\"><b>2017 Forbes Value Rank</b>: " + properties.Rank + "</p>";
    var season = attribute.split("_")[1];
    var seasonSpend = "<p id=\"fees\"><b>" + season + " Transfer Fees</b>: &euro;" + properties[attribute] + "  MM</p>";
    
    var panelContent = crest + teamText + locationText + rankText + seasonSpend;

    //replace the layer popup
    layer.bindPopup(popupContent, {
        offset: new L.Point(0,-(radius/2))
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
            var circles = {
                max: 80,
                mean: 120,
                min: 160
            }
            
            //Step 2: loop to add each circle and text to svg string
            for (var circle in circles){
                //circle string
                svg += '<circle class="legend-circle" id="' + circle + 
                '" fill="white" fill-opacity="1" stroke="#000000" stroke-width="2" cx="92"/>';
                
                svg += '<text id="' + circle + '-text" x="200" y="' + circles[circle] + '"></text>';
            };
            
            svg += "</svg>";

            //add attribute legend svg to container
            $(container).append(svg);

            return container;
        }
    });

    map.addControl(new LegendControl());

    updateLegend(map, attributes[9]);
};

//Update the legend with new attribute
function updateLegend(map, attribute){
    //create content for legend
    var year = attribute.split("_")[1];
    var content = year + " Season";

    //replace legend content
    $('#temporal-legend').html("<b id='legend-season'>"+content+"</b>");
    
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
    
    var newHeight = Number(circleValues["max"])-99;
    console.log(newHeight);
    //$(".legend-control-container").css({"height":newHeight})
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

function createSearch(map, geodata){
    var features = geodata["features"];
    var teamList = [];
    for (var i = 0; i < features.length; i++) {
        var team = String(features[i]["properties"]["Team"]);
        teamList.push(team);
    };
    var teamListABC = teamList.sort();
    
    var SearchControl = L.Control.extend({
        options: {
            position: 'bottomleft'
        },

        onAdd: function (map) {
            // create the control container with a particular class name
            var container = L.DomUtil.create('div', 'search-control-container');            
            return container;
        }
    });

    map.addControl(new SearchControl());
    populateSearchDrop(map,geodata,teamListABC);

};

function populateSearchDrop(map,geodata,list) {
    
    $(".search-control-container").append('<select id="select-drop-down"><option value="zoom">Zoom to...</option>');
    $("#select-drop-down").append('<option value="full">FULL MAP</option>');
    
    for (var i = 0; i < list.length; i++) {
        var team = list[i];
        var value = team.replace(/\s+/g, '');
        $("#select-drop-down").append('<option value='+value+'>'+team+'</option>');
    };
    
    $(".search-control-container").append('</select>');
    $("#select-drop-down").change(function() {
        reZoom(map,this,geodata);
    });
};

function reZoom(map,e,data) {
    var team = e.options[e.selectedIndex].text;
    var features = data["features"];
    function teamCheck(element, index, array) {
        return element["properties"]["Team"] == team;
    };
    var index = Number(features.findIndex(teamCheck));
    if (team === "FULL MAP") {
        map.setView([47.75, -1.7], 5);
    } else if ( index >= 0 && index < features.length) {
        var latitude = features[index]["geometry"]["coordinates"][1];
        var longitude = features[index]["geometry"]["coordinates"][0];
        map.setView([(latitude - .007), (longitude - .025)], 12);
    }
};

$(document).ready(createMap);