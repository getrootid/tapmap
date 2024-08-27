'use strict';

var map;
var stateLayers = null;
var selectedLayer = null;
var selectedPerson = null;
var defaultLocation = [38.505, -100.09];

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
        "lat": 37.904200,
        "lng": -122.294460
    },
    {
        "name": "Rosalee Mickela",
        "image": "",
        "law_school": "Harding Elementary",
        "employer": "Jason Neumark Mickela",
        "lat": 38.904200,
        "lng": -121.294460
    }

]


function InitializeMap() {
    map = L.map('map-section__map').setView(defaultLocation, 4);


    // L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    //     maxZoom: 19,
    //     attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    // }).addTo(map);

    L.tileLayer('http://services.arcgisonline.com/arcgis/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19,
        attribution: '&copy; ESRI'
    }).addTo(map);

    // Free, too dark. No lines between states.
    // L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png', {
    //     maxZoom: 19,
    //     attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>'
    // }).addTo(map);

    // Free? Need an account.
    // L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png', {
    //     maxZoom: 19,
    //     attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>'
    // }).addTo(map);

    

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

function populatePeopleList() {
    const elPeopleList = document.getElementById('info-panel-person__people');

    peopleData.forEach(person => {
        const li = document.createElement('li');
        const button = document.createElement('button');
        button.appendChild(document.createTextNode(person.name));
        button.setAttribute('data-person-id', person.name);
        button.onclick = onPersonListButtonPress;

        li.appendChild(button);
        elPeopleList.appendChild(li);
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
        person.marker = marker;
        
        marker.addTo(map)
    });
}

function getMarkerFromPerson(person) {
    return person.marker;
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

    // Show the third tab.
    selectMapTab(2);

    // Update the person tab.
    SelectPerson(marker.person);
}

/**
 * Handles the event when the user clicks on a state.
 * Both the map interaction aspect (selecting, zooming...), and the info panel.
 * 
 * @param {*} e 
 */
function onStateClick(e) {
    var layer = e.target;

    selectMapTab(1);
    SelectLayer(layer);
    updateStateInfoWindow(layer.feature.properties);
    showStateInfoWindow();
    
}

function onStateListButtonPress(e) {
    const stateLayer = getStateLayerById(e.target.dataset.stateId);

    SelectLayer(stateLayer);
    updateStateInfoWindow(stateLayer.feature.properties);
    showStateInfoWindow();
    
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

function updatePersonInfoWindow(personData) {
    const elName = document.getElementById('info-panel-person__name');
    // const elStudentCount = document.getElementById('info-panel-state__num-students');
    // const elLawSchoolsWrapper = document.getElementById('info-panel-state__law-schools');

    // console.log(stateData);

    elName.innerHTML = personData.name;
    // elStudentCount.innerHTML = stateData.studentCount;

    // elLawSchoolsWrapper.replaceChildren();

    // if(stateData.lawSchools) {
    //     stateData.lawSchools.forEach(school => {
    //         const li = document.createElement('li');
    //         li.appendChild(document.createTextNode(school));
    //         elLawSchoolsWrapper.appendChild(li);
    //     });
    // }
}

function showStateInfoWindow() {
    const button = document.getElementById('tab-button-1');

    const stateList = document.getElementsByClassName('map-section__info-panel-state--state-list')[0];
    const stateInfo = document.getElementsByClassName('map-section__info-panel-state--state-data')[0];

    // If there's a currently selected state, then show the state info.
    if(selectedLayer) {
        updateStateInfoWindow(selectedLayer.feature.properties);
        stateList.setAttribute('aria-hidden', true);
        stateInfo.setAttribute('aria-hidden', false);
    } else {
        // If there's no currently selected state, show the state list.
        stateList.setAttribute('aria-hidden', false);
        stateInfo.setAttribute('aria-hidden', true);
    }
}

function showPersonInfoWindow() {
    const button = document.getElementById('tab-button-2');

    const personList = document.getElementsByClassName('map-section__info-panel-person--list')[0];
    const personInfo = document.getElementsByClassName('map-section__info-panel-person--data')[0];

    // If there's a currently selected state, then show the state info.
    if(selectedPerson) {
        updatePersonInfoWindow(selectedPerson);
        personList.setAttribute('aria-hidden', true);
        personInfo.setAttribute('aria-hidden', false);
    } else {
        // If there's no currently selected state, show the state list.
        personList.setAttribute('aria-hidden', false);
        personInfo.setAttribute('aria-hidden', true);
    }
}


/**
 * Shows a person's details in the sidebar and focuses the map on that person.
 * 
 * @param {*} personDetails 
 */
function SelectPerson(personDetails) {
    selectedPerson = personDetails;

    updatePersonInfoWindow(personDetails);
    showPersonInfoWindow();
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
    if(layer) {
        layer.setStyle(defaultStateBorder);
        selectedLayer = false;
    }
}


function InitializeTabs() {
    const tabs = [...document.getElementsByClassName("map-section__tab-button")];

    tabs.forEach(button => {
        button.onclick = onTabButtonClick;
    });
}

function selectMapTab(index) {
    const tabs = [...document.getElementsByClassName("map-section__tab")];
    const activeTab = document.getElementsByClassName("map-section__tab--selected")[0];

    // If the currently active tab is the same nth child as index, do nothing.
    if(activeTab == tabs[index]) {
        return;
    }

    tabs.forEach(tab => {
        
        if(tab == tabs[index]) {
            tab.classList.add('map-section__tab--selected');
            const button = tab.getElementsByTagName('button')[0];
            const panel = document.getElementById(button.getAttribute('aria-controls'));

            button.setAttribute('aria-selected', true);
            panel.setAttribute('aria-hidden', false);
        } else {
            // If this isn't the active tab, then make sure it's hidden.
            tab.classList.remove('map-section__tab--selected');
            const button = tab.getElementsByTagName('button')[0];
            const panel = document.getElementById(button.getAttribute('aria-controls'));
            button.setAttribute('aria-selected', false);
            panel.setAttribute('aria-hidden', true);
        }
    });

}

function onPersonListButtonPress(e) {
    const person = peopleData.find(person => person.name == e.target.dataset.personId);

    // Zoom in on this person's marker.
    const marker = getMarkerFromPerson(person);
    map.setView(marker.getLatLng(), 10);

    SelectPerson(person);
}

function onTabButtonClick(e) {
    const button = e.target;

    // If the button is in the first list item, reset the map view
    if(button.parentElement == document.querySelector('.map-section__tabs li:first-child')) {
        map.setView(defaultLocation, 4);
    }

    // get the curently active button. it will have aria-selected=true
    const activeButton = document.querySelector('.map-section__tab-button[aria-selected="true"]');

    // Get the first, second, and third list items under: .map-section__tabs
    const listItems = [...document.querySelectorAll('.map-section__tabs li')];

    // If the active button is the same as the one clicked, and it's the first child, do nothing.
    if(activeButton === button && button == listItems[0].firstChild) {
        return;
    }

    // If the active button is the same as the one clicked, and it's the third button, hide the person info and
    // show the person list.
    if(activeButton === button && button == listItems[0].firstChild) {
        return;
    }

    selectMapTab(listItems.indexOf(button.parentElement));

    // If this is the state tab, show the state selection list.
    if(button == listItems[1].firstChild) {
        // Clear the currently selected state.
        DeSelectLayer(selectedLayer);
        showStateInfoWindow();
    }

    // If this is the person tab, show the person selection list.
    if(button == listItems[2].firstChild) {
        // Clear the currently selected state.
        selectedPerson = null;
        showPersonInfoWindow();
    }
}


InitializeMap();
PopulateStatesList();
populatePeopleList();
InitializeTabs();