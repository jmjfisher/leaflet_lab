//function to instantiate the Leaflet map
function createMap(){
    
    //create the map
    var map = L.map('mapid').setView([47, 1.673078133], 5);

    //add base tilelayer
    L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
        attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
        maxZoom: 18,
        id: 'mapbox.streets',
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

//Create new sequence controls
function createSequenceControls(map, attributes){
    //create range input element (slider)
    $('#panel').append('<input class="range-slider" type="range">');
    $('#panel').append('<button class="skip" id="reverse">Back</button>');
    $('#panel').append('<button class="skip" id="forward">Next</button>');
    
    $('.range-slider').attr({
        max: 9,
        min: 0,
        value: 0,
        step: 1
    })
    
    $('.skip').click(function() {
        //get the old index value
        var index = $('.range-slider').val();

        //Step 6: increment or decrement depending on button clicked
        if ($(this).attr('id') == 'forward'){
        index++;
        //Step 7: if past the last attribute, wrap around to first attribute
        index = index > 9 ? 0 : index;
        console.log(index);
        } else if ($(this).attr('id') == 'reverse'){
        index--;
        //Step 7: if past the first attribute, wrap around to last attribute
        index = index < 0 ? 9 : index;
        console.log(index);
        };

        //Step 8: update slider
        $('.range-slider').val(index);
        updatePropSymbols(map, attributes[index]);
    });
    
    $('.range-slider').on('input', function() {
        var index = $(this).val();
        console.log(index);
        updatePropSymbols(map, attributes[index]);
    });
};

//calculate radius of each symbol based on total max/min values, max radius of 75 for entire dataset
function calcPropRadiusJM(attValue) {
    var radius = 5+((attValue-4.5)/319.8)*75;
    return radius;
};

//function to convert markers to circle markers
function pointToLayer(feature, latlng, attributes){
    
    //Determine which attribute to visualize with proportional symbols
    var attribute = attributes[0];
    console.log(attribute);

    //create marker options
    var options = {
        fillColor: "#ff7800",
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

    //build popup content string
    var panelContent = "<p><b>Team:</b> " + feature.properties.Team + "</p><p><b>" + attribute + ":</b> &euro;" + feature.properties[attribute] + "MM</p>";
    
    var popupContent = feature.properties.Team;

    //bind the popup to the circle marker
    layer.bindPopup(popupContent, {
        offset: new L.Point(0,-options.radius)
    });

    layer.on({
    mouseover: function(){
        this.openPopup();
    },
    mouseout: function(){
        this.closePopup();
    },
    click: function(){
        $('#panel').append(panelContent);
        //$('#panel').html(panelContent);
    }
    });

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
            
            createPropSymbols(response, map, attributes);
            createSequenceControls(map, attributes);
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

        //add city to popup content string
        var popupContent = "<p><b>Team:</b> " + props.Team + "</p>";

        //add formatted attribute to panel content string
        var year = attribute.split("_")[1];
        popupContent += "<p><b>Population in " + year + ":</b> " + props[attribute] + " million</p>";

        //replace the layer popup
        layer.bindPopup(popupContent, {
        offset: new L.Point(0,-radius)
        });
        };
    });
};

//all functions defined, load the map!
$(document).ready(createMap);