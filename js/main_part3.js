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

//Create new sequence controls
function createSequenceControls(map){
    //create range input element (slider)
    $('#panel').append('<input class="range-slider" type="range">');
    $('#panel').append('<button class="skip" id="reverse">Reverse</button>');
    $('#panel').append('<button class="skip" id="forward">Skip</button>');
    
    $('.range-slider').attr({
        max: 9,
        min: 0,
        value: 0,
        step: 1
    })
};

//calculate radius of each symbol based on total max/min values, max radius of 75 for entire dataset
function calcPropRadiusJM(attValue) {
    var radius = ((attValue-4.5)/319.8)*75;
    return radius;
};

//function to convert markers to circle markers
function pointToLayer(feature, latlng){
    //Determine which attribute to visualize with proportional symbols
    var attribute = "Season_17/18";

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
function createPropSymbols(data, map){
    //create a Leaflet GeoJSON layer and add it to the map
    L.geoJson(data, {
        pointToLayer: pointToLayer
    }).addTo(map);
};
    
//function to retrieve the data and place it on the map
function getData(map){
    //load the data
    $.ajax("data/transfers.geojson", {
        dataType: "json",
        success: function(response){

            createPropSymbols(response, map);
            createSequenceControls(map);
        }
    });
};

//all functions defined, load the map!
$(document).ready(createMap);