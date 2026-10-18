"use strict"

// Array for lat/lng coords of the marker
const polygonCoords = [];
// Hier werden die Koordinatenpunkte der Marker gespeichert für die Polylines
const solidPolyline = [];
// Hier werden die Koordinatenpunkte der Marker gespeichert für das Polyline der Maus
const dottedPolyline = [];
// Hier werden die Koordinatenpunkte zum berechnen gespeichert
let locationData = {
    building:{
        floorSize: null,
        roofAngle: 30,
        azimuth: 0
    },
    location:{
        address: null,
        coordinates: null
    },
    pvModule:{
        height: null,
        width: null,
        power: null,
        loss: null,
    },
    modules: 0,
    peakPower: null,
    averInstCost: null,
    totalInstCost: null,
    energyCost: 40,
    person: 4,
    consumption: null,
    devices: 8,
};

let centerOfRoof = {
    lat: null,
    lng: null
};

// Hier werden die Marker auf der Map hinzugefügt (für listener und entfernen der Marker)
const allMarker = [];
// Hier werden die Koordinaten des Polygons gespeicher, die nach dem Berechnen erscheinen
const polygon = [];
// Marker Options
const markerIcon = L.icon({
    iconUrl: "../icons/marker.png",
    iconSize: [20, 20],  // Icon size
    iconAnchor: [10, 10], // Icon anchor point (center)
});

// Second adress input field
const locationInput =document.getElementById("location-input");

// Next button to get to the next calculation sequence
const nextButtons = document.querySelectorAll(".next-button");

// Go back button to get to the previous calculation sequence
const prevButtons = document.querySelectorAll(".previous-button");

// Draw tool button
const drawButton = document.querySelector(".draw-marker").parentElement;
// Drag tool button
const dragButton = document.querySelector(".drag-marker").parentElement;
// Undo tool button
const undoButton = document.querySelector(".undo-marker").parentElement;
// Delete tool button
const deleteButton = document.querySelector(".delete-marker").parentElement;
// All tool buttons
const buttonsToolbar = document.querySelectorAll(".map-icon");

// Boolean to check if the user restartet floor plot calculation
let restart = false;
// Boolean to check if a floor plot is calculated
let calculated = false;
// Global Scope Constante for Map
const map = [];
// Map previev Mobile device ist shown when user drags marker
const mapPreview = [];
// Marker shown in Map preview for mobile devices
let markerPreview;

window.addEventListener("load", initMap);


// Initialize map
function initMap() {

    // Autocomplete und Map laden vom zweiten Eingabefeld
    autocomplete(locationInput);

    map.push(L.map('map'));

    mapPreview.push(L.map('map-preview'));
    
    L.gridLayer.googleMutant({
        type: 'satellite', // Es gibt auch 'roadmap', 'terrain', und 'hybrid'
        maxZoom: 23
    }).addTo(map[0]);
    
    L.gridLayer.googleMutant({
        type: 'satellite', // Es gibt auch 'roadmap', 'terrain', und 'hybrid'
        maxZoom: 23
    }).addTo(mapPreview[0]);

    // Listener for adding marker on roof
    map[0].on("click", function(e){
        // Check if draw button is selected to place marker on map
        if(drawButton.classList.contains("active")){
            placeMarker(e.latlng);
        };
    });

    // Listener for the dotted polyline which is between the last marker and
    // the current mouse position
    map[0].on('mousemove',function(e){
        if(allMarker.length !== 0 && calculated === false){
            placeDottedPolyline(e.latlng);
        };
    });

    // Remove dotted polyline when mouse leaves the map
    map[0].on('mouseout',function(){
        removeDottedPolyLines();
    });

    // When the second adress input is clicked
    locationInput.addEventListener("click", function(){
        // Only show alert when restart is false to prevent alert to be shown every
        // time the input field is clicked
        if(restart == false){
            // Blur input field
            locationInput.blur();
            showAlert();
        }else if(restart == true){
            // In case the user already moved on to next sequences, the first
            // sequence will be shown
            goToDataSequence(0);

            if(calculated == true){
                // Block draw- and undobutton if surface area is calculated
                blockButton([drawButton,undoButton]);
            };
        };
    });

    // Listener für draw Button
    drawButton.addEventListener("click",function(){
        if(!this.classList.contains("blocked")){    
            // Abfrage ob eine Berechnung stattgefunden hat damit nach der Berechnung keine weiteren Marker gesetzt werden können
            if(calculated == false){
                // Draw Button aktivieren
                activateButton(drawButton);
            };    
            // Disable next button
            nextButtonStatus(1,"disable");
        };
    });

    // Listener für drag Button
    dragButton.addEventListener("click",function(){
        if(!this.classList.contains("blocked")){
            // Drag Button aktivieren
            activateButton(dragButton);
        };
    });

    // Eventlistener für den delete Button und das Löschen aller Marker
    deleteButton.addEventListener('click', function(){
        if(!deleteButton.classList.contains("blocked")){
            // Alert user of loosing entered data
            showAlert();
        };
    });

    // Eventlistener für den undo Button und das Löschen des letzten Markers
    undoButton.addEventListener("click",function(){
        // Abfrage ob eine Berechnung stattgefunden hat damit nach der Berechnung
        // keine weiteren Marker entfernt werden können und der Button freigegeben ist
        if(calculated == false && !undoButton.classList.contains("blocked")){
            // Letzte Markierung entfernen
            undoLastMarker();
            // Abfrage ob alle Marker entfernt wurden
            if(allMarker.length == 0){
                removeDottedPolyLines();
                blockButton([undoButton,deleteButton]);
            };
        };
    });

    fetchLocationAndPvValue().then( result => {
        try {
            const { location, lat, lng, height, width, power, loss, averInstCost } = result;

            panMapToCoords(lat,lng);
    
            // Write the searched address in the current input field
            locationInput.value = location;

            locationData.pvModule = { height: +height, width: +width, power: power, loss: +loss };
            locationData.location.address = location;
            locationData.averInstCost = +averInstCost;
            locationData.location.coordinates = {
                lat: lat,
                lng: lng
            };

            const distortionAngleSelection = Math.abs(document.getElementById("distortionAngleSelection").value);
            const roofAngleSelection = document.getElementById("roofAngleSelection").value;
            
            moduleHeight = calculateModuleHeight(roofAngleSelection,locationData.pvModule.height);
            moduleWidth = calculateModuleHeight(distortionAngleSelection,locationData.pvModule.width);
            
        } catch (error) {
            console.error('Fehler beim Abrufen der Daten:', error);
        };
    });
};

async function fetchLocationAndPvValue(){
    try {
        const response = await fetch('/getUserLocation');
        const result = await response.json();

        return result;
    } catch (error){
        console.error('Fehler beim Abrufen der Daten:', error);
    };
};

// When the second adress input is clicked
locationInput.addEventListener("click", function(){
    // Only show alert when restart is false to prevent alert to be shown every
    // time the input field is clicked
    if(restart == false){
        // Blur input field
        locationInput.blur();
        showAlert();
    }else if(restart == true){
        // In case the user already moved on to next sequences, the first
        // sequence will be shown
        goToDataSequence(0);

        if(calculated == true){
            // Block draw- and undobutton if surface area is calculated
            blockButton([drawButton,undoButton]);
        }else if(calculated == false){
            // Block undo- and deletebutton if the surface area is typed manually
            blockButton([undoButton,deleteButton]);
        };
    };
});

// Switch to certain data sequence to change previous entries
function goToDataSequence(i){
    const allDataSequences = document.querySelectorAll(".data-sequence");

    if(!allDataSequences[i].classList.contains("data-show")){

        allDataSequences.forEach((e)=>{
            if(e.classList.contains("data-show")){
                e.classList.remove("data-show");
            };
        });

        allDataSequences[i].classList.add("data-show");

        // Activate drag button
        activateButton(dragButton);
    };
};

function updateLocationInDb(data) {
    const obj = data.location;

    if(obj.address != null && obj.coordinates != null){

        fetch(`/sendUserLocation`, {
          method: 'POST', // Du kannst hier auch 'GET', 'PUT', 'DELETE', etc. verwenden, abhängig von deinen Anforderungen
          headers: {
            'Content-Type': 'application/json', // Gib den Datentyp an, den du sendest (JSON in diesem Fall)
          },
          body: JSON.stringify(data), // Die Daten im Anfragekörper als JSON senden
        })
        .then(response => {
            if (response.ok) {
              return response.json();
            }else{
              throw new Error('Fehler bei der Anfrage');
            };
        })
        .then(responseData => {
            // Hier kannst du die Antwort des Servers verarbeiten
            console.log('Antwort vom Server:', responseData);
        })
        .catch(error => {
            console.error('Fehler:', error);
        });
    };
};

// Function für Autocomplete
function autocomplete(inp){

    // Narrow down autocomplete results to germany
    const options = {
        componentRestrictions: {
            country: "de"
        },
    };

    const ac = new google.maps.places.Autocomplete(inp, options);

    // Event fires when new place is searched
    google.maps.event.addListener(ac,"place_changed", function(){

        // Delete all markers when searched place is changed
        deleteAllMarker();

        // Get place information
        const place = ac.getPlace();

        // Add address and coordinates of searched place if search was successful
        if(Object.hasOwn(place, "geometry")){

            // Set address of searched place
            locationData.location.address = place.formatted_address;

            // Set latitude and longitude of searched place
            locationData.location.coordinates = {
                lat: place.geometry.location.lat(),
                lng: place.geometry.location.lng()
            };

            panMapToCoords(place.geometry.location.lat(),place.geometry.location.lng());

            // Send new location to DB
            updateLocationInDb(locationData);

            // Restart is set to false after new place is searched
            restart = false;
        };
    });
};

function showAlert(){
    const alertBox = document.querySelector(".warning-container");
    const confirm = document.querySelector("#yes");
    const denie = document.querySelector("#no");

    // Alert box pops up
    alertBox.classList.add("warning-show");

    // Confirm button sets restart to true, deletes all marker on map and hides alert box
    confirm.addEventListener("click",function(){
        // Set restart to true to prevent alert to be triggert again
        // except restart is false
        restart = true;
        // Warnung schließen
        alertBox.classList.remove("warning-show");
        // Alle Marker und Koordinate für eine neue Berechnung entfernen
        deleteAllMarker();
        // In case the user already moved on to next sequences, the first
        // sequence will be shown
        goToDataSequence(1);
        // Remove PV Modules from Map and Array
        removeGridCells();
        // Remove edge Polygon for roof edge selection from Map and Array
        clearEdgePolylines();
    });

    // Denie button hides aler box without any changes
    denie.addEventListener("click", function(){
        alertBox.classList.remove("warning-show");
    });
};

//  Place Polyline between coordinates 
function placeSolidPolyline(){

    if(allMarker.length >= 2){

        solidPolyline.forEach((line)=>{
            line.removeFrom(map[0]);
        });

        solidPolyline.push(L.polyline([polygonCoords],{
            opacity: 1,
            weight: 3,
            zIndexOffset: 2,
            color: "#1E9DA8"
        }).addTo(map[0]));
    };
};

//  Platzieren einer Messlinie zwischen zwei Markern auf der Karte
function placeDottedPolyline(c){

    removeDottedPolyLines();

    const coord = [
        [
            polygonCoords[polygonCoords.length-1][0], 
            polygonCoords[polygonCoords.length-1][1]
        ],
        [
            c.lat,
            c.lng
        ]
    ];

    // Line options for dotted Polyline
    const lineOptions = {
        color: '#1E9DA8',
        weight: 2.5,
        opacity: 1,
        dashArray: '1, 5', // 'dot size , gap size'
        clickable: false,
        interactive: false
    };

    // Füge die Linie zur Karte hinzu
    dottedPolyline.push(L.polyline(coord, lineOptions).addTo(map[0]));
};

// Platzieren eines Markers auf der Karte und Berechnung der Fläche
function placeMarker(location) {

    let lat = location.lat;
    let lng = location.lng;

    removeDottedPolyLines();

    // Set marker to the map
    const marker = L.marker([lat, lng], {
        icon: markerIcon,
        zIndexOffset: 1,
        draggable: true,
    }).addTo(map[0]);

    // Add marker to the allMarkers Array
    allMarker.push(marker);

    // Abfrage um den ersten Marker zu selektieren
    if(allMarker.length === 1){
        // Restart is set to false after new place is searched
        restart = false;
        // Delete- und Undo-Button nach dem ersten Marker freigeben
        blockButton();
        // Listener für den ersten Marker um die Berechnung zu starten
        marker.on('click',function(){
            // Abfrage um Berechnung erst ab dem dritten Marker freizugeben
            if(allMarker.length >= 3 && calculated == false){
                // Fläche des Polygon berechnen
                calculateArea();
                // Koordinate des ersten Markers an die letzte stelle kopieren damit letzte Polyline mit dem ersten verbindet
                polygonCoords.push(polygonCoords[0]);
                // Add last polyline
                placeSolidPolyline();
                // Drag Button nach dem Berechnen aktivieren
                activateButton(dragButton);
                // Undo- und drawButton nach dem Berechnen blocken
                blockButton([drawButton,undoButton]);
                // Polyline zwischen des letzten Markers und der Mausposition entfernen
                removeDottedPolyLines();
            };
        });
    };

    // Add Marker lat/lng coords to polygon Array
    addPolygonCoords(lat,lng);

    // For mobile devices there will be shown a snippet of the map for preview
    // while dragging a marker
    function dragPreview(){
        // Container for map preview 
        const frameContainer = document.querySelector(".map-container");
        // Show preview container if container is hidden
        if(!frameContainer.classList.contains("show-preview")){
            frameContainer.classList.add("show-preview");
        };
    };

    // Close preview snippet when user stops dragging a marker
    function closeDragPreview(){
        // Container for map preview 
        const frameContainer = document.querySelector(".map-container");
        // hide preview container
        frameContainer.classList.remove("show-preview");
    };
    
    // Listener für den Marker feuert sobald das Bewegen des Markers beendet wurde
    marker.on('dragstart', function(){
        // Check if mobile device to start map preview while dragging marker
        if(window.navigator.maxTouchPoints > 1){
            // Update red dot Marker pos in map preview
            updateMarkerMapPreview(marker)
            // Show Map preview for mobile devices
            dragPreview();
            // Set and update position of preview container
            setMapPreviewPos()
        };
    });
    
    // Listener für die Marker feuert sobald Marker bewegt wird
    marker.on('drag', function(){
        // Koordinate des Markers wird aktualisiert
        updateMarkerPosition(this);
        // Alle Polylines werden entfernt
        removeAllPolyLines();
        // PolyLines werden mit den aktualisierten Koordinaten hinzugefügt
        placeSolidPolyline();
        // Active Polyline wird entfernt sobald Marker verschoben wird
        removeDottedPolyLines();
        // Abfrage ob Berechnung stattgefunden hat
        if(calculated == true){
            // Wenn eine Berechnung stattgefunden hat dann wird polygon (darstellung der gemessenen Fläche) mit aktualisiert
            polygon[0].setLatLngs(polygonCoords);
        };

        // Check if mobile device to start map preview while dragging marker
        if(window.navigator.maxTouchPoints > 1){
            updateMarkerMapPreview(marker)
        };
    });
    
    // Listener für den Marker feuert sobald das Bewegen des Markers beendet wurde
    marker.on('dragend', function(){
        // Update calculation of marked surface after dragging/relocating marker
        if(calculated == true){
            calculateArea();
        };

        // Check if mobile device to hide map preview when user stops dragging
        if(window.navigator.maxTouchPoints > 1){
            closeDragPreview()
        };
    });

    // Add last polyline
    placeSolidPolyline();
};

function addPolygonCoords(lat,lng){
    polygonCoords.push([lat, lng]);
};

// Enable drag option for marker
function updateMarkerDragOption(option){
    allMarker.forEach((m)=>{
        if(option === true){
            m.dragging.enable();
        }else if(option === false){
            m.dragging.disable();
        };
    });
};

// Die hinterlegten Positionen der bewegten Marker aktualisieren für die Berechnung
function updateMarkerPosition(marker){
    let lat = marker.getLatLng().lat;
    let lng = marker.getLatLng().lng;

    // For loop um alle Marker abzufragen
    for(let i = 0; i < allMarker.length; i++){
        // Abfrage um den richtigen Marker zu identifizieren
        if(marker == allMarker[i]){
            // Breitengrad der neuen Markerposition hinzufügen
            polygonCoords[i][0] = lat;
            // Längengrad der neuen Markerposition hinzufügen
            polygonCoords[i][1] = lng;
        };
    };
};

function updateMarkerMapPreview(marker){
    let lat = marker.getLatLng().lat;
    let lng = marker.getLatLng().lng;

    mapPreview[0].setView([lat, lng],22);

    if(markerPreview){
        markerPreview.setLatLng([lat,lng]);
    } else {
        // Set dot as Marker for preview mobile devices
        markerPreview = L.circle([lat, lng], {
            color: '#FF0000', // Randfarbe
            opacity: 1, // Randtransparenz
            weight: 2, // Randstärke
            fillColor: '#FF0000', // Füllfarbe
            fillOpacity: 1, // Fülltransparenz
            radius: 0.07, // Radius in Meter
        }).addTo(mapPreview[0]);
    };
};

function setMapPreviewPos(){
    const mapContainer = document.getElementById("map");
    const mapLeft = mapContainer.getBoundingClientRect().left;
    const mapTop = mapContainer.getBoundingClientRect().top;
    const widthMap = mapContainer.getBoundingClientRect().width;

    const previewContainer = document.querySelector(".map-container");
    const heightPrev = previewContainer.getBoundingClientRect().height;
    const widthPrev = previewContainer.getBoundingClientRect().width;

    const inputContainer = document.querySelector(".input-bar");
    const inpHeight = inputContainer.getBoundingClientRect().height;

    const offsetY = 25;
    const minX = widthPrev/2;
    const maxX = widthMap-(widthPrev/2);
    const minY =  +inpHeight + +heightPrev + offsetY;
    
    mapContainer.addEventListener('touchmove', (event) => {
        const touch = event.touches[0];
        const x = touch.clientX - mapLeft;
        const y = touch.clientY - mapTop;

        if(x <= minX){
            previewContainer.style.left = `0px`;
        } else if(x >= maxX){
            previewContainer.style.left = `${widthMap-widthPrev}px`;
        } else {
            previewContainer.style.left = `${x-(widthPrev/2)}px`;
        };

        if(y <= minY){
            previewContainer.style.top = `${inpHeight}px`;
        } else {
            previewContainer.style.top = `${y-heightPrev-offsetY}px`;
        };
    });
};


// Calculate surface area of poligon by the coordinates of placed marker
function calculateArea() {

    // Clear previous data of polygon variable (old data)
    if(polygon.length > 0){
        // Clear border lines of old polygon
        polygon[0].removeFrom(map[0]);
        // Clear coordinates of old polygon
        polygon.pop();
    };
    
    // Create outline and fill color of polygon on map
    polygon.push(L.polygon([polygonCoords],{
        opacity: 0,
        zIndexOffset: 1,
        fillColor: "#1e9da8a7"
    }).addTo(map[0]));

    // Enable next button to get to next sequence
    nextButtonStatus(1,"enable");
    // // Calculate surface area of polygon
    // const area = google.maps.geometry.spherical.computeArea(polygon[0].getPath());
    // Set calculated true
    calculated = true;
    // // Set floor size in location data
    // locationData.building.floorSize = area;

    centerMap();
};

















var moduleHeight;
var moduleWidth;
var edgePolylines = [];
var grid = [];
// var modules = 0;
var distortion = 0;
var start;
var end;
var heading;

function calculateModuleHeight(angle,length){
    const rad = angle * (Math.PI / 180);
    const cosValue = Math.cos(rad);
    const newLength = (cosValue * length).toFixed(2);

    return newLength;
};

document.querySelector("#roofAngleSelection").addEventListener("input",function(){
    // Get HTML Element to display distortion angle
    const displayRoofAngle = document.querySelector("#displayRoofAngle");
    // Original height of module
    const orgHeight = locationData.pvModule.height;
    // Display the new roof angle
    displayRoofAngle.textContent = this.value + "°";
    // Set the new roof angle to location data
    locationData.building.roofAngle = this.value;
    // Set the new calculated module height
    moduleHeight = +(calculateModuleHeight(this.value, orgHeight));
    // Check if the user selected a roof edge to align the grid cells
    if(start && start !== undefined && end && end !== undefined){
        // remove current grid cells
        removeGridCells()
        // Convert variable to readable format for google maps
        const convertedCoords = polygonCoords.map((arr) => { return {lat: arr[0], lng: arr[1]}})
        // Create google maps polygon
        const convertedPolygon = new google.maps.Polygon({paths: convertedCoords});
        // Calculate and display new grid cells
        calculateAndDisplayModules(convertedPolygon, start, end, heading, distortion);
    };
});

// User selects distortion angle with slider
document.querySelector("#distortionAngleSelection").addEventListener("input",function(){
    // Get HTML Element to display distortion angle
    const displayDistortionAngle = document.querySelector("#displayDistortionAngle");
    // Original width of module
    const orgWidth = locationData.pvModule.width;
    // Display the new distortion angle
    displayDistortionAngle.textContent = this.value + "°";
    // Set the new calculated module with
    moduleWidth = +(calculateModuleHeight(this.value, orgWidth));
    // Set the selected distortion angle to global variable
    distortion = +this.value;
    // Check if the user selected a roof edge to align the grid cells
    if(start && start !== undefined && end && end !== undefined){
        // remove current grid cells
        removeGridCells()
        // Convert variable to readable format for google maps
        const convertedCoords = polygonCoords.map((arr) => { return {lat: arr[0], lng: arr[1]}})
        // Create google maps polygon
        const convertedPolygon = new google.maps.Polygon({paths: convertedCoords});
        // Calculate and display new grid cells
        calculateAndDisplayModules(convertedPolygon, start, end, heading, distortion);
    };
});

function updateModules(){
    // Run function if the module count is already calculated
    // Prevents the function from running when DOM loads
    if(locationData.modules && locationData.modules !== 0){
        // Get HTML Element to display the module count
        var moduleCount = document.querySelector("#moduleCount");
        // Get HTML Element to display the peak power of countet modules
        var maxPower = document.querySelector("#maxPower");
        // Set calculated peak power to variable
        var kwp = ((locationData.modules * locationData.pvModule.power)/1000).toFixed(3);
        // Set peak power to location data
        locationData.peakPower = kwp;
        // Calculate total installation cost and set to variable
        locationData.totalInstCost = kwp*locationData.averInstCost.toFixed(2);
        // Display the module count to HTML Element
        moduleCount.textContent = `${locationData.modules} Module`;
        // Display the peak power to HTML Element
        maxPower.textContent = `${kwp.replace(".",",")} kWp`;
    };
};

function disableEdge(){
    edgePolylines.forEach((edge) => {
        edge.setStyle({
            color: "#122B4E"
        });
    });
};

function identifyTopAndBottom(path){
    var top, bottom;
    // // Identify the top and the bottom endpoint of the clicked roof edge
    // path.getAt(0).lat() <= path.getAt(1).lat()
    // ? (bottom = path.getAt(0), top = path.getAt(1))
    // : (bottom = path.getAt(1), top = path.getAt(0));

    console.log(path)

    // Identify the top and the bottom endpoint of the clicked roof edge
    path[0].lat <= path[1].lat
    ? (bottom = path[0], top = path[1])
    : (bottom = path[1], top = path[0]);

    return {top, bottom};
};

function setAzimuth(path, polygon){
    const markerCountPyramidHip = 3;
    var angle = 90;
    var {top, bottom} = identifyTopAndBottom(path);

    const azimuth = google.maps.geometry.spherical.computeHeading(bottom, top);

    // for(let i = 0; i < path.getLength(); i++){
    for(let i = 0; i < path.length; i++){

        const insideCount = setCheckCoordinates(start, end, (azimuth + angle), polygon);

        if(insideCount.some(checkInsideCount)){
            // Check if roof type is not pyramid hip
            if(allMarker.length > markerCountPyramidHip){
                // Check if roof is headed to west
                if(angle < 0){
                    locationData.building.azimuth = (azimuth + 90);
                // Check if roof is headed to east
                } else if(angle > 0){
                    locationData.building.azimuth = (azimuth - 90);
                };
                // Check if roof type is pyramid hip
            } else if(allMarker.length === markerCountPyramidHip){
                // Check if roof is headed to east
                if(angle < 0){
                    locationData.building.azimuth = (azimuth - 90);
                // Check if roof is headed to west
                } else if(angle > 0){
                    locationData.building.azimuth = (azimuth + 90);
                };
            };

            console.log(locationData.building.azimuth);

            break;
        };

        angle = -90;
    };
};

function checkInsideCount(point){
    return point === true;
};

function setCheckCoordinates(start, end, angle, polygon){
    var dist = 0.25;

    var firstCheck = new google.maps.LatLng(((end.lat() + start.lat()) / 2), ((end.lng() + start.lng()) / 2));
    var secondCheck = new google.maps.LatLng(((end.lat() + firstCheck.lat()) / 2), ((end.lng() + firstCheck.lng()) / 2));
    var thirdCheck = new google.maps.LatLng(((firstCheck.lat() + start.lat()) / 2), ((firstCheck.lng() + start.lng()) / 2));

    var firstCheckCoord = google.maps.geometry.spherical.computeOffset(firstCheck, dist, angle);
    var secondCheckCoord = google.maps.geometry.spherical.computeOffset(secondCheck, dist, angle);
    var thirdCheckCoord = google.maps.geometry.spherical.computeOffset(thirdCheck, dist, angle);

    var checkCoords = [firstCheckCoord, secondCheckCoord, thirdCheckCoord];

    var insideCount = checkCoords.map(point => google.maps.geometry.poly.containsLocation(point, polygon));
    // var insideCount = checkCoords.map(point => google.maps.geometry.poly.containsLocation(point, convertedPolygon));

    return insideCount;
};

function identifyStartAndEnd(path, polygon){
    var pathCoords = [path[0], path[1]];

    for(let i = 0; i < pathCoords.length; i++){
        start = new google.maps.LatLng(pathCoords[0].lat, pathCoords[0].lng);
        end = new google.maps.LatLng(pathCoords[1].lat, pathCoords[1].lng);
        heading = google.maps.geometry.spherical.computeHeading(start, end);
        var angle = (heading + 90);

        const insideCount = setCheckCoordinates(start, end, angle, polygon);

        console.log(insideCount);

        if(insideCount.some(checkInsideCount)) break;
        
        pathCoords.reverse();
    }
};

function getRotatedPolygonCoords(bottom, top, path){

    var rotatedPath = [];

    var angleClicked = google.maps.geometry.spherical.computeHeading(bottom, top);

    path.forEach((coord) => {
        var angleCoord = google.maps.geometry.spherical.computeHeading(bottom, coord);
        var distance = google.maps.geometry.spherical.computeDistanceBetween(bottom, coord);

        if(angleClicked <= 0){
            if(angleCoord <= 0){
                rotatedPath.push(google.maps.geometry.spherical.computeOffset(bottom, distance, (angleCoord + Math.abs(angleClicked))));
            } else if(angleCoord >= 0){
                rotatedPath.push(google.maps.geometry.spherical.computeOffset(bottom, distance, (angleCoord + Math.abs(angleClicked))));
            };
        } else if(angleClicked >= 0){
            if(angleCoord >= 0){
                rotatedPath.push(google.maps.geometry.spherical.computeOffset(bottom, distance, (angleCoord - angleClicked)));
            } else if(angleCoord <= 0){
                rotatedPath.push(google.maps.geometry.spherical.computeOffset(bottom, distance, (angleCoord - angleClicked)));
            };
        };
    });

    return rotatedPath;
};

function getBounding(path){
    var rotatedPath = getRotatedPolygonCoords(start, end, path);

    var n = start;
    var e = start;
    var s = start;
    var w = start;

    for(let i = 0; i < rotatedPath.length; i++){
        if(rotatedPath[i].lat() > n.lat() && rotatedPath[i].lat() > start.lat()) n = rotatedPath[i];
        if(rotatedPath[i].lat() < s.lat() && rotatedPath[i].lat() < start.lat()) s = rotatedPath[i];
        if(rotatedPath[i].lng() > e.lng() && rotatedPath[i].lng() > start.lng()) e = rotatedPath[i];
        if(rotatedPath[i].lng() < w.lng() && rotatedPath[i].lng() < start.lng()) w = rotatedPath[i];
    };

    n = new google.maps.LatLng(n.lat(), start.lng());
    e = new google.maps.LatLng(start.lat(), e.lng());
    s = new google.maps.LatLng(s.lat(), start.lng());
    w = new google.maps.LatLng(start.lat(), w.lng());

    var distanceNorth = +(google.maps.geometry.spherical.computeDistanceBetween(start, n)).toFixed(2);
    var distanceEast = +(google.maps.geometry.spherical.computeDistanceBetween(start, e)).toFixed(2);
    var distanceSouth = +(google.maps.geometry.spherical.computeDistanceBetween(start, s)).toFixed(2);
    var distanceWest = +(google.maps.geometry.spherical.computeDistanceBetween(start, w)).toFixed(2);

    return {distanceNorth, distanceEast, distanceSouth, distanceWest}
};

// Funktion zur Aktivierung der Kantenauswahl
function enableEdgeSelection(polygon) {
    var path = polygon.getLatLngs()[0].map(function(coord){
        return [coord.lat, coord.lng];
    });

    // console.log(path)
    clearEdgePolylines();
    for (var i = 0; i < path.length; i++) {
        var edge = L.polyline([path[i], path[(i + 1) % path.length]],{
            opacity: 1,
            weight: 5,
            zIndexOffset: 1,
            color: "#122B4E"
        }).addTo(map[0]);

        edge.on('click', function(){
            // Remove edge polygon
            disableEdge();
            // Weiter Button deaktivieren
            nextButtonStatus(2,"enable");
            // Get Path of the clicked Roof edge
            // var clickedPath = this.getPath();
            var clickedPath = this.getLatLngs();
            // Set the color of the clicked roof edge to green
            this.setStyle({
                color: "#34ff00"
            });

            // Convert variable to readable format for google maps
            const convertedCoords = polygonCoords.map((arr) => { return {lat: arr[0], lng: arr[1]}})
            // Create google maps polygon
            const convertedPolygon = new google.maps.Polygon({paths: convertedCoords});

            // Identify the startpoint/endpoint of the clicked roof
            // so the PV Modules will be set inside of the Polygon
            // identifyStartAndEnd(clickedPath, polygon);
            identifyStartAndEnd(clickedPath, convertedPolygon);


            // Get the heading angle of the clicked roof edge
            // heading = google.maps.geometry.spherical.computeHeading(start, end);
            // setAzimuth(clickedPath, polygon);
            setAzimuth(clickedPath, convertedPolygon);
        });
        // Add edge to Array
        edgePolylines.push(edge);
    }
};

// Funktion zum Löschen der Polylinien
function clearEdgePolylines() {
    edgePolylines.forEach(function (edge) {
        // edge.setMap(null);
        edge.removeFrom(map[0]);
    });
    edgePolylines = [];
};










// Funktion zur Berechnung und Anzeige der Module
function calculateAndDisplayModules(polygon, start, end, heading, tiltAngle) {
    var distance = google.maps.geometry.spherical.computeDistanceBetween(start, end);
    var path = polygon.getPath();
    var {distanceNorth, distanceEast, distanceSouth, distanceWest} = getBounding(path);
    var negativeCols = Math.floor(distanceSouth / moduleWidth);
    var positiveCols = Math.floor(distanceNorth / moduleWidth);
    var negativeRows = Math.floor(distanceWest / moduleHeight);
    var positiveRows = Math.floor(distanceEast / moduleHeight);
    var offsetY = +((distanceEast - (positiveRows * moduleHeight)) / 2).toFixed(2);
    var offsetX = +((distance - (Math.floor(distance / moduleWidth) * moduleWidth)) / 2).toFixed(2);

    var perpendicularAngle = heading + 90;
    var tiltedPerpendicularAngle = perpendicularAngle + tiltAngle;

    for (var i = -negativeRows; i < positiveRows; i++) {
        for (var j = -negativeCols; j < positiveCols; j++) {
            var offsetXLatLng = google.maps.geometry.spherical.computeOffset(start, offsetX, heading);
            var offsetYLatLng = google.maps.geometry.spherical.computeOffset(offsetXLatLng, (i * moduleHeight) + offsetY, tiltedPerpendicularAngle);
            var moduleSW = google.maps.geometry.spherical.computeOffset(offsetYLatLng, (j * moduleWidth), heading);
            var moduleSE = google.maps.geometry.spherical.computeOffset(moduleSW, moduleWidth, heading);
            var moduleNE = google.maps.geometry.spherical.computeOffset(moduleSE, moduleHeight, tiltedPerpendicularAngle);
            var moduleNW = google.maps.geometry.spherical.computeOffset(moduleSW, moduleHeight, tiltedPerpendicularAngle);

            var distortedModule = [moduleSW, moduleSE, moduleNE, moduleNW];

            var insideCount = distortedModule.filter(point => google.maps.geometry.poly.containsLocation(point, polygon)).length;

            var fillColor;
            if (insideCount === 4) {
                fillColor = '#122B4E'; // Alle Punkte innerhalb
                locationData.modules += 1;
            // } else if (insideCount > 2) {
            //     fillColor = 'transparent'; // Teilweise innerhalb
            } else {
                continue; // Komplett außerhalb, wird nicht angezeigt
            };

            var convertedModuleCoords = distortedModule.map((coords) => {
                return [coords.lat(), coords.lng()];
            });

            var modulePolygon = L.polygon([convertedModuleCoords], {
                color: 'white',
                opacity: 1,
                weight: 1,
                fillColor: fillColor,
                fillOpacity: 0.65
            }).addTo(map[0]);

            modulePolygon.on('click', function(){
                // const color = this.get("fillColor");
                const color = this.options.fillColor;
                color === "transparent" ? locationData.modules += 1 : locationData.modules -= 1;
                // this.setOptions({ fillColor: color === 'transparent' ? "#122B4E" : 'transparent' });
                this.setStyle({ fillColor: color === 'transparent' ? "#122B4E" : 'transparent' });
                updateModules();
            });

            grid.push(modulePolygon);
        };
    };
    // Update the displayed module count
    updateModules();
};

function removeGridCells() {
    if (grid && grid.length > 0) {
        // grid.forEach(cell => cell.setMap(null));
        grid.forEach(cell => cell.removeFrom(map[0]));
        grid = [];
        locationData.modules = 0;
        updateModules();
    };
};

function panMapToCoords(lat,lng) {
    // Pan map to the center of the calculated surface area
    mapPreview[0].setView([lat, lng], 20);
    // Pan map to the center of the calculated surface area
    map[0].setView([lat, lng], 20);
};


// Identifies the center 
function centerMap(){
    // identify max lat from polygonCoords Array
    const latMax = Math.max(...polygonCoords.map(el => el[0]));
    // identify min lat from polygonCoords Array
    const latMin = Math.min(...polygonCoords.map(el => el[0]));
    // identify max lng from polygonCoords Array
    const lngMax = Math.max(...polygonCoords.map(el => el[1]));
    // identify min lng from polygonCoords Array
    const lngMin = Math.min(...polygonCoords.map(el => el[1]));
    // calculate the center of the lat path
    const centerLat = (latMin + latMax) / 2;
    // calculate the center of the lng path
    const centerLng = (lngMin + lngMax) / 2;
    // Pan the map and the map preview (for mobile devices) to the center fo the polygon    
    panMapToCoords(centerLat,centerLng);
    // Set the coord of the polygon center to location data
    locationData.location.coordinates = {lat: centerLat, lng: centerLng};
    // set the canter of the polygon to the variable
    centerOfRoof = {lat: centerLat, lng: centerLng};
};

// Funtion für das Löschen aller Marker
function deleteAllMarker(){

    // Alle Marker auf der Map entfernen
    if(allMarker.length != 0){
        allMarker.forEach((m)=>{
            // m.setMap(null);
            m.removeFrom(map[0]);
        });
    };

    // Alle Marker in allMarker Constante entfernen
    while(allMarker.length > 0){
        allMarker.pop();
    };

    // Alle Coordinaten in polygonCoords Constante entfernen (für die Berechnung)
    while(polygonCoords.length > 0){
        polygonCoords.pop();
    };

    // Alle polylines entfernen
    removeAllPolyLines();
    
    // Polygon entfernen
    removePolygon();

    // Dotted Polyline der Maus entfernen
    removeDottedPolyLines();

    // Delete- und Undo-Button nach dem löschen aller Daten deaktivieren
    blockButton([deleteButton,undoButton]);

    // Weiter Button deaktivieren
    nextButtonStatus(1,"disable");

    // Calculated Variable auf false setzen weil alle Marker gelöscht werden
    calculated = false;
};

// Funktion für das Entfernen des Polygons (visuelle Darstellung der gemessenen Fläche)
function removePolygon(){
    // Messlinien der berechneten Fläche löschen
    if(polygon.length != 0){
        // polygon[0].setMap(null);
        polygon[0].removeFrom(map[0]);
    };
};

// Funktion für das entfernen aller Polylines
function removeAllPolyLines(){
    // // Alle Polygon Linien auf der Map entfernen
    // if(solidPolyline.length != 0){
    //     solidPolyline.forEach((line)=>{
    //         line.setMap(null);
    //     });
    // };

    // Alle Polygon Linien auf der Map entfernen
    if(solidPolyline.length != 0){
        solidPolyline.forEach((line)=>{
            line.removeFrom(map[0]);
        });
    };

    // Alle Polygon Linien in polyLines Constante entfernen
    while(solidPolyline.length > 0){
        solidPolyline.pop();
    };
};

// Funktion für das entfernen aller Polylines
function removeDottedPolyLines(){
    // // Alle Polygon Linien auf der Map entfernen
    // if(dottedPolyline.length != 0){
    //     dottedPolyline.forEach((line)=>{
    //         line.setMap(null);
    //     });
    // };

    // Alle Polygon Linien auf der Map entfernen
    if(dottedPolyline.length != 0){
        dottedPolyline.forEach((line)=>{
            line.removeFrom(map[0]);
        });
    };


    // Alle Polygon Linien in polyLines Constante entfernen
    while(dottedPolyline.length > 0){
        dottedPolyline.pop();
    };
};

// Funtion für das entfernen des letzten Markers
function undoLastMarker(){
    // Abfrage ob Marker zum entfernen vorhanden sind
    if(allMarker.length != 0 && polygonCoords.length != 0){
        // Letzten Marker von der Map entfernen
        allMarker[allMarker.length-1].removeFrom(map[0]);
        // Letzten Marker aus allMarker entfernen
        allMarker.pop();
        // Letzte Koordinate aus polygonCoords entfernen
        polygonCoords.pop();
        // Alle Polylines entfernen
        removeAllPolyLines();
        // Polylines mit den aktuellen Koordinaten hinzufügen
        placeSolidPolyline();
    };
};

// Funktion für die Button Auswahl (gewünschten Button aktiv setzen)
function activateButton(newBtn){

    // Alle Buttons mit der Klasse active wird die Klasse entfernt
    buttonsToolbar.forEach((btn)=>{
        if(btn.classList.contains("active")){
            btn.classList.remove("active");
        };
    });

    // Abfrage ob dragButton aktiviert werden soll
    if(newBtn == dragButton){
        // Map bewegung freigeben und cursor ändern
        map[0].getContainer().style.cursor = '';
    // Abfrage ob drawButton aktiviert werden soll
    }else if(newBtn == drawButton){
        // Map bewegung sperren und cursor ändern
        map[0].getContainer().style.cursor = 'crosshair';
    };

    if(newBtn){
        // Klasse active hinzufügen
        newBtn.classList.toggle("active");
    };
};

// Funktion um Buttons zu blocken
function blockButton(btn){
    buttonsToolbar.forEach((b)=>{
        if(b.classList.contains("blocked")){
            b.classList.remove("blocked");
        };
    });

    if(btn){
        btn.forEach((b)=>{
            b.classList.add("blocked");
        });
    };
};

// Funktion für das aktivieren und deaktivieren des Weiter Buttons
function nextButtonStatus(index,status){
    if(status === "disable"){
        nextButtons[index].classList.add("gray-color-background");
        nextButtons[index].classList.remove("turquoise-background");
    }else if(status === "enable"){
        nextButtons[index].classList.add("turquoise-background");
        nextButtons[index].classList.remove("gray-color-background");
    };
};

////////////////////////////////////////////////////
////////// Sequence Information pop up /////////////
////////// Questionmark in circle icon /////////////
////////////////////////////////////////////////////

const openHelp = document.querySelectorAll(".help");
const closeHelp = document.querySelectorAll(".close-help");

function getCenterofIcon(icon){
    const left = icon.getBoundingClientRect().left;
    const top = icon.getBoundingClientRect().top;
    const width = icon.getBoundingClientRect().width;
    const height = icon.getBoundingClientRect().height;

    const centerX = (left + (width / 2));
    const centerY = (top + (height / 2));

    return {centerX, centerY};
}

function setAbsoluteCoords(icon, modal){
    const {centerX, centerY} = getCenterofIcon(icon);
    modal.style.top = `${centerY}px`;
    modal.style.left = `${centerX}px`;
};

// show pop up when user clicks help button /questionmark in circle
openHelp.forEach((btn) => {
    btn.addEventListener("click", function(){
        let modal = this.parentElement.querySelector(".pop-up-overlay");
        modal.firstElementChild.scrollTo({top: 0});
        setAbsoluteCoords(this, modal);
        modal.classList.add("show-help");
    });
});

// Hide pop up when user clicks "verstanden" button
closeHelp.forEach((btn) => {
    btn.addEventListener("click", function(){
        const helpContainer = document.querySelectorAll(".sequence-info");

        helpContainer.forEach((container) => {
            if(container.contains(this)){
                let helpIcon = container.querySelector(".help");
                let modal = container.querySelector(".pop-up-overlay");
                setAbsoluteCoords(helpIcon, modal);
                modal.classList.remove("show-help");

                let startAnimation = setTimeout(function(){
                    helpIcon.classList.add("animation");
                }, 400);
        
                let removeAnimation = setTimeout(function(){
                    helpIcon.classList.remove("animation");
                },1000);
            };
        });
    });
});

////////////////////////////////////////////////////
/////// Eingaben in das Inputfeld für den //////////
// Jahresverbrauch und die Stromkosten überwachen //
////////////////////////////////////////////////////


function checkIfInputIsEmpty(input){
    // Get all sequences
    const allSeq = document.querySelectorAll(".data-sequence");
    // Get current sequence
    const currentSeq = input.parentElement.parentElement
    // Get all input tags in the current sequence
    const allInpFields = currentSeq.querySelectorAll("input");
    // Convert Node list to Array to be able to use every() method
    // to check if there is any input tag without value
    const inputHasValue = Array.from(allInpFields).every(input => input.value.trim() !== "")

    // If at least one input tag in the current sequence has no value
    // the NEXT Button will be disabled
    if(inputHasValue === true){
        // Get Index of current sequence to enable the right NEXT Button
        for(let i = 0; i < allSeq.length;i++){

            if(currentSeq === allSeq[i]){
                nextButtonStatus(i,"enable");
            };
        };
    } else if(inputHasValue === false){
        // Get Index of current sequence to disable the right NEXT Button
        for(let i = 0; i < allSeq.length;i++){

            if(currentSeq === allSeq[i]){
                nextButtonStatus(i,"disable");
            };
        };
    };
};

function inputMonitoring(){
    const inputField = document.querySelectorAll(".input-floor");

    inputField.forEach((el)=>{

        const unitSymbol = el.getAttribute("placeholder").split(" ")[1];
        
        // Listener to check every user entry to prevent forbidden value
        el.addEventListener("keydown",function(event){
            // Regular Expression for digit
            const num = new RegExp("\\d");
            // Regular Expression for , and .
            const comma = new RegExp("\\,|\\.");
            // Regular Expression for Backspace
            const backspace = new RegExp("Backspace");

            // Only allowed entries are numbers or backspace
            if(!num.test(event.key) && comma.test(event.key) && !backspace.test(event.key)){
                event.preventDefault();
            };
        
            // 0 is not allowed as the first entry
            if(this.selectionStart === 0 && event.key === "0"){
                event.preventDefault();
            };
        });
        
        el.addEventListener("input",function(){
            // Remove unit symbol if number is selected from input field dropdown
            if(this.value.includes(unitSymbol)){
                this.value = this.value.split(" ")[0];
            };
            
            if(this.id == "consumption"){
                // Set input value to location data
                locationData.consumption = this.value;
            }else if(this.id == "cost"){
                // Set input value to location data
                locationData.energyCost = this.value;
            };
        });        
        
        // Run certain function when input field has focus
        el.addEventListener("focus",function(){

            // Check if input field has unit symbol
            if(this.value.includes(unitSymbol)){
                // Delete unit symbol if input field has any
                this.value = this.value.replace(` ${unitSymbol}`,"");
            };
        });
        
        // Run certain function when input field is blurred
        el.addEventListener("blur",function(){

            // Check if input field has unit symbol
            if(!this.value.includes(unitSymbol) && this.value){
                // Add unit symbol if input field has none
                this.value = `${this.value} ${unitSymbol}`;        
            };

            checkIfInputIsEmpty(this);
        });
    });
};

inputMonitoring();

///////////////////////////////////////////////////
/////////////// Rooftype selection ////////////////
///////////////////////////////////////////////////

const roof = document.querySelectorAll(".icon-inner-container");

// Function to select roof type
function selectRoofType(el){
    // roof icon
    const i = el.querySelector(".roof-icon");
    // roof type label
    const l = el.querySelector(".flow-text-small");
    // roof 1
    const r1 = el.querySelector(".roof-1");

    // Set attribute to selected
    el.setAttribute("data","selected");

    // Change icon color to active when selected
    i.classList.add("icon-clicked");
    // Change label text color to active when selected
    l.classList.add("turquoise-color");
    // Change roof color to active when selected
    r1.classList.add("roof-active");
    // Set roof type in Location Data
    locationData.building.roofType = i.getAttribute("value");

    // Enable next button in roof type section
    nextButtonStatus(0,"enable");
};

// Function deactivates all active roof icons
function deselectRoofType(){
    roof.forEach((e)=>{
        const i = e.querySelector(".roof-icon");
        const l = e.querySelector(".flow-text-small");
        const r1 = e.querySelector(".roof-1");

        if(i.classList.contains("icon-clicked")){
            i.classList.remove("icon-clicked");
            l.classList.remove("turquoise-color");
            r1.classList.remove("roof-active");
        };

        if(i.hasAttribute("data-multiple-roof")){
            const r2 = e.querySelector(".roof-2");
            r2.classList.remove("roof-active");
        };

        if(e.getAttribute("data") == "selected"){
            e.removeAttribute("data");
        };
    });
};

// Add click event to roof type icon with functions
roof.forEach((el)=>{

    el.addEventListener("click",function(){
        // Get the roof type in value attribute
        const roofType = this.querySelector("svg").getAttribute("value");
        
        // If the clicked roof type is not already selected
        if(!el.hasAttribute("data-selected")){

            // Deselect the previously selected roof icon
            deselectRoofType();

            // Select the clicked roof icon
            selectRoofType(this);
        };
    });
});

///////////////////////////////////////////////////
/////// Progress bar for completed sequences //////
///////////////////////////////////////////////////

function updateProgressBar(btn){
    const sequences = document.querySelectorAll(".data-sequence");
    let progressBars = document.querySelectorAll(".bar div");

    for(let i = 0; i < sequences.length; i++){
        if(sequences[i].contains(btn)){

            if(btn.classList.contains("next-button")){
                progressBars[i + 1].classList.add("completed");
                break;
            } else if(btn.classList.contains("previous-button")){
                progressBars[i].classList.remove("completed");
                break;
            }
        };
    };
};

///////////////////////////////////////////////////
///////////// Next and Previous Button ////////////
///////////////////////////////////////////////////


// Disable map action when user goes from first page to second page of calculation area
function disableMapAction(parent){
    if(parent.classList.contains("floor")){
        // Block all tool buttons after user goes to next sequence to prevent map actions
        blockButton([drawButton,dragButton,deleteButton,undoButton]);
        // Deactivate map-tool buttons
        activateButton();
        // Enable draggable marker
        updateMarkerDragOption(false);
    };
};

// Enable map action when user comes back to first page of calculation area
function enableMapAction(sequence){
    if(sequence.classList.contains("floor")){

        if(calculated == true){
            // Block draw- and undobutton if surface area is calculated
            blockButton([drawButton,undoButton]);
        }else if(calculated == false){
            // Block undo- and deletebutton if the surface area is typed manually
            blockButton([undoButton,deleteButton]);
        };

        // Deactivate map-tool buttons
        activateButton(dragButton);
        // Enable draggable marker
        updateMarkerDragOption(true);
        // Enable dragging on map
        map[0].dragging.enable();
    };
};

// Calculate the energy consumption from user by the floor size and the default values
function calculateAverageConsumption(parent){
    if(parent.classList.contains("floor")){

        let averageAnnualConsumption;
        const consumptionInput = document.querySelector("#consumption");
        const {person,devices,building:{floorSize}} = locationData;

        averageAnnualConsumption = ((floorSize * 9) + (person * 200) + (devices * 200)).toFixed(0);

        locationData.consumption = +averageAnnualConsumption;
        consumptionInput.setAttribute("value",`${averageAnnualConsumption} kWh`);
    };
};

// Select the next page in the calculation area depending on user decision
function getNextDataSequence(parent){
    let nextDataSequence = parent.nextElementSibling;

    return nextDataSequence;
};

// Select the previous page in the calculation area depending on user decision
function getPreviousDataSequence(parent){
    const {building: {roofType}} = locationData;
    let previousDataSequence;

    if(parent.classList.contains("consumption") && roofType == "flat"){
        previousDataSequence = parent.previousElementSibling.previousElementSibling.previousElementSibling;
    }else{
        previousDataSequence = parent.previousElementSibling;
    };

    return previousDataSequence;
};

function removePolygon(){
    polygon.forEach((coord) => {
        coord.removeFrom(map[0]);
    });
};

// Next buttons to get to the next page in the calculation area
nextButtons.forEach((btn)=>{
    btn.addEventListener("click",function(){
        if(this.classList.contains("turquoise-background")){

            const parent = this.parentElement.parentElement;
            const nextDataSequence = getNextDataSequence(parent);

            if(nextDataSequence && nextDataSequence !== undefined && nextDataSequence !== null){

                if(parent.classList.contains("type")){
                    calculated === true ? blockButton([undoButton, drawButton]) : blockButton([undoButton,deleteButton]);
                    activateButton(dragButton);                    
                };

                if(parent.classList.contains("floor")){
                    disableMapAction(parent);
                    calculateAverageConsumption(parent);
                };

                if(nextDataSequence.classList.contains("edge")){
                    // Hide all polylines
                    // solidPolyline.forEach(line => line.setMap(null));
                    solidPolyline.forEach(line => line.removeFrom(map[0]));
                    // Hide all marker
                    // allMarker.forEach(marker => marker.setMap(null));
                    allMarker.forEach(marker => marker.removeFrom(map[0]));
                    // Hide Polygon surface
                    // polygon[0].setMap(null);
                    polygon[0].removeFrom(map[0]);
                    // Remove edge Polylines
                    clearEdgePolylines();
                    // Create edge polyline with latest parameters
                    enableEdgeSelection(polygon[0]);
                };
                
                if(nextDataSequence.classList.contains("modules")){
                    // Remove grid zells in case the user changed something
                    removeGridCells();
                    // Convert variable to readable format for google maps
                    const convertedCoords = polygonCoords.map((arr) => { return {lat: arr[0], lng: arr[1]}})
                    // Create google maps polygon
                    const convertedPolygon = new google.maps.Polygon({paths: convertedCoords});
                    // Set grid zells with latest parameters
                    calculateAndDisplayModules(convertedPolygon, start, end, heading, distortion);
                    // Hide edge Polygon
                    // edgePolylines.forEach(edge => edge.setMap(null));
                    edgePolylines.forEach(edge => edge.removeFrom(map[0]));
                };

                // Hide current sequence and show next sequence
                parent.classList.toggle("data-show");
                nextDataSequence.classList.toggle("data-show");
            };

            // Send Data to Backend when next/calculate Button in the last sequence is clicked
            if(parent.classList.contains("consumption")){
                loadingCursor("progress");
                sendDataToBackend(locationData);
            };

            updateProgressBar(this);
        };
    });
});

// Previous buttons to get to the previous page in the calculation area
prevButtons.forEach((btn)=>{
    btn.addEventListener("click",function(){
        if(this.classList.contains("turquoise-background")){
            const parent = this.parentElement.parentElement;
            const previousDataSequence = getPreviousDataSequence(parent);

            if(previousDataSequence.classList.contains("type")){
                blockButton([drawButton, dragButton, undoButton, deleteButton]);
            };

            if(previousDataSequence.classList.contains("edge")){
                // Hide Grid cells
                // grid.forEach(cell => cell.setMap(null));
                // edgePolylines.forEach( edges => edges.setMap(map[0]));
                grid.forEach(cell => cell.removeFrom(map[0]));
                edgePolylines.forEach( edges => edges.addTo(map[0]));
            };

            if(previousDataSequence.classList.contains("floor")){
                // Hide edge Polygon
                // edgePolylines.forEach( edges => edges.setMap(null));
                edgePolylines.forEach( edges => edges.removeFrom(map[0]));
                // Show all Marker
                // allMarker.forEach(marker => marker.setMap(map[0]))
                allMarker.forEach(marker => marker.addTo(map[0]))
                //Show all Polylines the user created
                // solidPolyline.forEach( line => line.setMap(map[0]));
                solidPolyline.forEach( line => line.addTo(map[0]));
                // Show Polygon surface
                // polygon[0].setMap(map[0]);
                polygon[0].addTo(map[0]);
                // Disable Next Button 
                nextButtonStatus(2,"disable")
            };

            parent.classList.toggle("data-show");
            previousDataSequence.classList.toggle("data-show");

            enableMapAction(previousDataSequence);
            
            updateProgressBar(this);
        };
    });
});

function loadingCursor(style){
    const body = document.querySelector("body");
    if(style === "progress"){
        body.classList.add("loading-cursor")
    } else if(style === "default"){
        body.classList.remove("loading-cursor");
    };
};

function sendDataToBackend(data) {
    fetch('/sendDataForPvgis', {
      method: 'POST', // Du kannst hier auch 'GET', 'PUT', 'DELETE', etc. verwenden, abhängig von deinen Anforderungen
      headers: {
        'Content-Type': 'application/json', // Gib den Datentyp an, den du sendest (JSON in diesem Fall)
      },
      body: JSON.stringify(data), // Die Daten im Anfragekörper als JSON senden
    })
      .then(response => {
        if (response.ok) {
            // set cursor to default after response from server
            loadingCursor("default");
            // Route to ersparnis
            window.open(`ersparnis`,"_self");
        } else {
            
          throw new Error('Fehler bei der Anfrage');
        }
      })
      .catch(error => {
        // set cursor to default after response from server
        loadingCursor("default");
        console.error('Fehler:', error);        

        let redirect = setTimeout(function(){
            // Route to solar rechner
            window.open(`solar-rechner`,"_self");
        }, 1000);
      });
};






  function abc(text){
    const a = document.createElement("div");
    const e = document.querySelector("#log");
    a.textContent = text;
    e.append(a);
  };


  (function log(){
    const e = document.createElement("div");
    e.id = "log";
    e.style.position = "fixed";
    e.style.top = "0px";
    e.style.fontSize = "10px";
    e.style.color = "red";
    e.style.zIndex = "10000"

    document.body.append(e);
  })();