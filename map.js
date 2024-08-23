'use strict';

var map;
var stateLayers = null;
var selectedLayer = null;

const defaultStateBorder = {
    opacity: 0,
    fillOpacity: 0
};

const hoverStateBorder = {
    opacity: 1,
    dashArray: '',
    color: "#cccccc",
    weight: 2
};

const selectedStateBorder = {
    opacity: 1,
    dashArray: '=',
    color: "#dfdfdf",
    weight: 5,
};


// const stateData = [
//     {
//         "name": "California",
//         "student_count": 32768,
//         "law_schools": [
//             "Stanford"
//         ]
//     }
// ];

const peopleData = [
    {
        "name": "Jason Neumark Mickela",
        "image": "https://media.licdn.com/dms/image/v2/D5603AQFu3HgMXPPjCw/profile-displayphoto-shrink_100_100/profile-displayphoto-shrink_100_100/0/1719858694235?e=1729728000&v=beta&t=haPs9E9UJsovBZB0Xgh4J6cVB2YeWJVZN7OEw_wAw7M",
        "law_school": "San Franciso State University",
        "employer": "rootid",
        "lat": 42.006186,
        "lng": -123.233256
    },
    {
        "name": "Rosalee Mickela",
        "image": "",
        "law_school": "Harding Elementary",
        "employer": "Jason Neumark Mickela",
        "lat": 42.006186,
        "lng": -123.433256
    }

]


function InitializeMap() {
    map = L.map('map-section__map').setView([38.505, -100.09], 4);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);


    ShowPeople();
    ShowStates();

    return map;
}

/**
 * Create the list of states/territories that you see on the state tab when no
 * state is selected.
 * 
 * This should be called after the map is initialized.
 */
function PopulateStatesList() {
    const elStateList = document.getElementById('info-panel-state__states');

    statesData.features.forEach(state => {


        const li = document.createElement('li');
        const button = document.createElement('button');
        button.appendChild(document.createTextNode(state.properties.name));
        button.setAttribute('data-state-id', state.id);
        button.onclick = onStateListButtonPress;

        li.appendChild(button);
        
        if(state.id == "72") {
            elStateList.insertBefore(li, elStateList.firstChild);
        } else {
            elStateList.appendChild(li);
        }
    });
}   


/**
 * Shows all people on the map, used during map initialization.
 */
function ShowPeople() {
    peopleData.forEach(person => {
        // Plot person on the map.
        // L.circle([person.lat, person.lng], {
        //     color: "red",
        //     weight: 20,
        //     zIndex: 999
        // }).addTo(map);

        var marker = L.marker([person.lat, person.lng], {
        });

        marker.person = person;
        marker.on('click', onPersonMarkerClick);
        
        marker.addTo(map)
    });
}

/**
 * Makes all states clickable.
 */
function ShowStates() {
    const style = {
        fillColor: "red",
        opacity: 0,
        fillOpacity: 0
    };

    stateLayers = L.geoJson(statesData, {style: style, onEachFeature: onEachFeature}).addTo(map);

    function onEachFeature(feature, layer) {
        layer.on({
            mouseover: onStateMouseOver,
            mouseout: onStateMouseOut,
            click: onStateClick
        });
    }
}

function onPersonMarkerClick(e) {
    const marker = e.target;

    console.log(marker.person);
}

/**
 * Handles the event when the user clicks on a state.
 * Both the map interaction aspect (selecting, zooming...), and the info panel.
 * 
 * @param {*} e 
 */
function onStateClick(e) {
    var layer = e.target;

    updateStateInfoWindow(layer.feature.properties);
    showStateInfoWindow();
    SelectLayer(layer);
}

function onStateListButtonPress(e) {
    const stateLayer = getStateLayerById(e.target.dataset.stateId);

    updateStateInfoWindow(stateLayer.feature.properties);
    showStateInfoWindow();
    SelectLayer(stateLayer);
}

function onStateMouseOver(e) {
    const layer = e.target;

    if(layer !== selectedLayer) {
        layer.setStyle(hoverStateBorder);
    }
}

function onStateMouseOut(e) {
    const layer = e.target;

    if(layer !== selectedLayer) {
        layer.setStyle(defaultStateBorder);
    }
}

function getStateLayerById(id) {
    var foundLayer = null;

    stateLayers.eachLayer(layer => {
        console.log(layer.feature.id);
        console.log(id);
        console.log('===');
        if(layer.feature.id == id) {
            foundLayer = layer;
        }
    });

    return foundLayer;
}

function updateStateInfoWindow(stateData) {
    const elTitle = document.getElementById('info-panel-state__title');
    const elStudentCount = document.getElementById('info-panel-state__num-students');
    const elLawSchoolsWrapper = document.getElementById('info-panel-state__law-schools');

    console.log(stateData);

    elTitle.innerHTML = stateData.name;
    elStudentCount.innerHTML = stateData.studentCount;

    elLawSchoolsWrapper.replaceChildren();

    if(stateData.lawSchools) {
        stateData.lawSchools.forEach(school => {
            const li = document.createElement('li');
            li.appendChild(document.createTextNode(school));
            elLawSchoolsWrapper.appendChild(li);
        });
    }
    
}

function showStateInfoWindow() {
    const button = document.getElementById('tab-button-1');

    // If no state is selected

    // Hide the state info section

    // Show a list of states the user can select.
}



/**
 * Shows a person's details in the sidebar and focuses the map on that person.
 * 
 * @param {*} personDetails 
 */
function SelectPerson(personDetails) {

}

function SelectLayer(layer) {
    if(selectedLayer) {
        DeSelectLayer(selectedLayer);
    }

    layer.setStyle(selectedStateBorder);
    map.fitBounds(layer.getBounds());
    selectedLayer = layer;
}

function DeSelectLayer(layer) {
    layer.setStyle(defaultStateBorder);
    selectedLayer = false;
}


/**
 * 
 * Zooms map the coords given. Generally used by the SelectPerson function, as opposed to selecting a state or territory.
 * 
 * @param {*} coords 
 */
function ZoomToCoords(coords) {

}


InitializeMap();
PopulateStatesList();