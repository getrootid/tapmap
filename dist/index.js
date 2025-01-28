'use strict';

var map;
var stateLayers = null;
var selectedLayer = null;
var selectedPerson = null;
var defaultLocation = [38.505, -100.09];
let peopleData = [];
let alumniGroupTitles = [];
let alumniGroups = [];
let selectedAlumniGroup = null;

const hidePanelButton = document.getElementById('map-section__info-panel-header__hide-panel');
const showPanelButton = document.getElementById('map-section__info-panel-header__show-panel');
hidePanelButton.onclick = togglePanelClick;
showPanelButton.onclick = togglePanelClick;

const defaultStateStyle = {
  opacity: 0,
  fillOpacity: 0
};

const stateHasVolunteersStyle = {
  opacity: 1,
  fillOpacity: 0.7,
  color: "#0080FF",
  fillColor: "#0080FF",
  weight: 2

}

const hoverStateStyle = {
  opacity: 1,
  dashArray: '',
  color: "#cccccc",
  weight: 2
};

const selectedStateStyle = {
  opacity: 1,
  fillOpacity: 0.5,
  dashArray: '=',
  color: "#1431AF",
  fillColor: "#0080FF",
  weight: 5,
};

function togglePanelClick(e) {
  const panel = document.getElementById('map-section__info-panel');
  const panelWrapper = document.getElementById('map-section__info-panel-wrapper');

  if(panelWrapper.classList.contains('map-section__info-panel-wrapper--hidden')) {
    panelWrapper.classList.remove('map-section__info-panel-wrapper--hidden');
  } else {
    panelWrapper.classList.add('map-section__info-panel-wrapper--hidden');
  }
}

function showPanel() {
  const panelWrapper = document.getElementById('map-section__info-panel-wrapper');
  panelWrapper.classList.remove('map-section__info-panel-wrapper--hidden');
}

function InitializeMap() {
  const mapDiv = document.getElementById("map-section__map");
  map = L.map(mapDiv).setView(defaultLocation, 4);

  map.createPane("locationMarkers");
  map.getPane("locationMarkers").style.zIndex = 999;

  // L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  //     maxZoom: 19,
  //     attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  // }).addTo(map);

  // L.tileLayer('http://services.arcgisonline.com/arcgis/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
  //   maxZoom: 19,
  //   attribution: '&copy; ESRI'
  // }).addTo(map);

  L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
    maxZoom: 16
  }).addTo(map);

  const resizeObserver = new ResizeObserver(() => {
    map.invalidateSize();
  });

  resizeObserver.observe(mapDiv);



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

  const stateDataTSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSNds5T_0uWILX-HwgrmBtH_I5gB1lDNOl3PfE0nMxrsWA-47RxXKEafvV91e1raSXhxKTXq9209Vx1/pub?gid=1790286957&single=true&output=tsv";
  const stateDataCSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSNds5T_0uWILX-HwgrmBtH_I5gB1lDNOl3PfE0nMxrsWA-47RxXKEafvV91e1raSXhxKTXq9209Vx1/pub?gid=1790286957&single=true&output=csv";

  // Get the state data from the Google Sheet and combine it with the state geojson.
  Papa.parse(stateDataCSV, {
    download: true,
    header: true,
    complete: function(results) {
      const newStateData = results.data;

      newStateData.forEach(state => {
        // Use the state abbr field to match to the ID field in statesData and add this data
        // to that object in the features property.
        const stateFeature = statesData.features.find(feature => feature.id == state.abbreviation);

        if(stateFeature !== undefined) {
          stateFeature.properties.name = state.name;
          stateFeature.properties.students = state.students;
          stateFeature.properties.volunteers = state.volunteers;
          stateFeature.properties.schools = state.schools;

          // Replace \n with <br /> in the text field.
          state.text = state.text.replace(/\n/g, '<br />');

          stateFeature.properties.textContent = state.text;
        }
      });

      // Run after all the data is loaded:
      ShowStates();
    }});


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

  // Get the data from the alumni csv file at: https://docs.google.com/spreadsheets/d/e/2PACX-1vSNds5T_0uWILX-HwgrmBtH_I5gB1lDNOl3PfE0nMxrsWA-47RxXKEafvV91e1raSXhxKTXq9209Vx1/pub?gid=0&single=true&output=csv
  const csvUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSNds5T_0uWILX-HwgrmBtH_I5gB1lDNOl3PfE0nMxrsWA-47RxXKEafvV91e1raSXhxKTXq9209Vx1/pub?gid=0&single=true&output=csv";

  // get the data
  Papa.parse(csvUrl, {
    download: true,
    header: true,
    complete: function(results) {
      console.log(results);

      peopleData = results.data;

      peopleData.forEach(person => {
        // If person.lat and person.lng is empty, and person.address isn't, geocode the address.
        if(person.lat === "" && person.lng === "" && person.address !== "") {
          // Geocode the address.
          const geocodeUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${person.address}`;
          fetch(geocodeUrl)
            .catch(error => console.error('Error:', error))
            .then(response => response.json())
            .then(data => {

              if(data.length > 0) {
                person.lat = data[0].lat;
                person.lng = data[0].lon;

                addPersonToMap(person);
              }
            });
        } else {
          addPersonToMap(person);
        }

        // If the person has a setting for group, make sure it's in the group list.
        if(person.group !== undefined && !alumniGroupTitles.includes(person.group)) {
          alumniGroupTitles.push(person.group);
        }

        // Add this person to the alumniGroups array for their group, make sure it's in alphabetical order.
        if(person.group !== undefined) {
          if(alumniGroups[person.group] === undefined) {
            alumniGroups[person.group] = [];
          }

          alumniGroups[person.group].push(person);
          alumniGroups[person.group].sort((a, b) => {
            if(a.name < b.name) {
              return -1;
            }

            if(a.name > b.name) {
              return 1;
            }

            return 0;
          });
        }
      });
    }
  });



}

function addPersonToMap(person) {
  var marker = L.circleMarker([person.lat, person.lng], {
    radius: 4.5,
    weight: 1,
    opacity: 1,
    fillOpacity: 1,
    pane: "locationMarkers",
    color: "#FFFFFF",
    fillColor: "#8A0B0B",
  });

  marker.person = person;
  marker.on('click', onPersonMarkerClick);
  person.marker = marker;

  marker.addTo(map);
}

function getMarkerFromPerson(person) {
  return person.marker;
}


function getDefaultStateStyle(stateData) {
  if(stateData.volunteers !== undefined) {
    return stateHasVolunteersStyle;
  } else {
    return defaultStateStyle;
  }
}

/**
 * Makes all states clickable.
 */
function ShowStates() {
  stateLayers = L.geoJson(statesData, {onEachFeature: onEachFeature}).addTo(map);

  function onEachFeature(feature, layer) {
    layer.on({
      mouseover: onStateMouseOver,
      mouseout: onStateMouseOut,
      click: onStateClick
    });

    layer.setStyle(getDefaultStateStyle(feature.properties));
  }
}

function onPersonMarkerClick(e) {
  const marker = e.target;

  // Show the third tab.
  selectMapTab(2);

  // Update the person tab.
  SelectPerson(marker.person);

  showPanel();
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

  // If the panel is hidden, show it.
  showPanel();
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
    layer.setStyle(hoverStateStyle);
  }
}

function onStateMouseOut(e) {
  const layer = e.target;

  if(layer !== selectedLayer) {
    layer.setStyle(getDefaultStateStyle(layer.feature.properties));
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
  const elVolunteerCount = document.getElementById('info-panel-state__num-volunteers');
  const elSchoolCount = document.getElementById('info-panel-state__num-schools');
  const elStateText = document.getElementById('map-section__info-panel-state__text');


  //const elLawSchoolsWrapper = document.getElementById('info-panel-state__law-schools');


  elTitle.innerHTML = stateData.name;
  elStudentCount.innerHTML = stateData.students;
  elVolunteerCount.innerHTML = stateData.volunteers;
  elSchoolCount.innerHTML = stateData.schools;

  elStateText.innerHTML = stateData.textContent;

  // elLawSchoolsWrapper.replaceChildren();
  //
  // if(stateData.lawSchools) {
  //   stateData.lawSchools.forEach(school => {
  //     const li = document.createElement('li');
  //     li.appendChild(document.createTextNode(school));
  //     elLawSchoolsWrapper.appendChild(li);
  //   });
  // }
}

function updatePersonInfoWindow(personData) {
  const elName = document.getElementById('info-panel-person__name');
  const elImage = document.getElementById('info-panel-person__photo');
  const elEmployer = document.getElementById('info-panel-student__employer');
  const elLawSchool = document.getElementById('info-panel-student__school');
  const elAdditionalInfo = document.getElementById('info-panel-student__additional');

  const elWrapper = elName.parentElement;

  elName.innerHTML = personData.name;
  elEmployer.innerHTML = personData.employer;
  elLawSchool.innerHTML = personData.lawSchool;
  elAdditionalInfo.innerHTML = personData.additional;

  // If additional is empty, set a hidden flag on .map-section__info-panel-field--additional
  if(personData.additional) {
    elAdditionalInfo.parentElement.classList.remove('map-section__info-panel-field--hidden');
  } else {
    elAdditionalInfo.parentElement.classList.add('map-section__info-panel-field--hidden');
  }

  if(personData.image) {
    elImage.setAttribute('src', personData.image);
    // Add class to parent when the image is there
    elWrapper.classList.add('map-section__info-panel-person--has-image');
  } else {
    elImage.setAttribute('src', '');
    elWrapper.classList.remove('map-section__info-panel-person--has-image');
  }
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

function onStateBackToListClick() {
  DeSelectLayer(selectedLayer);
  showStateInfoWindow();
}
document.getElementById('info-panel-state__back').onclick = onStateBackToListClick;

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

    // Make sure the select list has each of the groups in it.
    const elAlumniGrouplist = document.getElementById('info-panel-student__group-select');
    const alumniGroups = alumniGroupTitles.map(group => {
      const option = document.createElement('option');
      option.value = group;
      option.appendChild(document.createTextNode(group));
      return option;
    });

    // Put alumniGroups into alphabetical order.
    alumniGroups.sort((a, b) => {
      if(a.value < b.value) {
        return -1;
      }

      if(a.value > b.value) {
        return 1;
      }

      return 0;
    });

    elAlumniGrouplist.replaceChildren(...alumniGroups);
    elAlumniGrouplist.onchange = e => {
      onAlumniDisplayGroupChange(e.target.value);
    }

    if(selectedAlumniGroup) {
      elAlumniGrouplist.value = selectedAlumniGroup;
      onAlumniDisplayGroupChange(selectedAlumniGroup);
    } else {
      // Have the first option be the default, and show that group in the list.
      elAlumniGrouplist.selectedIndex = 0;

      const group = elAlumniGrouplist.options[0].value;
      onAlumniDisplayGroupChange(group);
    }


    personList.setAttribute('aria-hidden', false);
    personInfo.setAttribute('aria-hidden', true);


  }
}

function onAlumniDisplayGroupChange(groupName) {
  selectedAlumniGroup = groupName;
  const groupData = alumniGroups[groupName];
  const elAlumniList = document.getElementById('info-panel-person__people');

  elAlumniList.replaceChildren();

  groupData.forEach(person => {
    const li = document.createElement('li');
    const button = document.createElement('button');
    button.appendChild(document.createTextNode(person.name));
    button.setAttribute('data-person-id', person.name);
    button.onclick = onPersonListButtonPress;

    li.appendChild(button);
    elAlumniList.appendChild(li);
  });
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

  layer.setStyle(selectedStateStyle);
  map.fitBounds(layer.getBounds());
  selectedLayer = layer;
}

function DeSelectLayer(layer) {
  if(layer) {
    layer.setStyle(getDefaultStateStyle(layer.feature.properties));
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
  map.setView(marker.getLatLng(), 6);
  SelectPerson(person);
}

function onPersonBackToListButtonPress() {
  selectedPerson = null;
  showPersonInfoWindow();
}
document.getElementById('map-section__info-panel-person__back').onclick = onPersonBackToListButtonPress;

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