// var map = L.map('map').setView([49.75, 15.25], 8)
var map = L.map('map').setView([50.05, 14.45], 12);


var partylist = ['ANO', 'ČSSD', 'KSČM', 'ODS', 'Piráti', 'PRAHA SOBĚ', 'SPD', 'StaPP', 'Spojené Síly', 'Zelení'];

// TODOS
// test geolocation
// party color not found: sanitize

maxWidth = window.innerWidth / 4;

// use geolocation!
function onLocationFound(e) {
  map.locate({setView: true, maxZoom: 16});
}

// function onLocationError(e) {
  // map.setView([49.75, 15.25], 7);
// }

function onLocationError(e) {
  map.setView([50.1, 14.5], 12);
}

map.on('locationfound', onLocationFound);
map.on('locationerror', onLocationError);



L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 16,
  attribution: 'Podkladová data &copy; přispěvatelé <a href="http://openstreetmap.org">OpenStreetMap</a> ' +
    '(<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>) ' +
    '| Vizualizace podkladu © <a href="http://mapbox.com">Mapbox</a> ' +
    '| Vymezení okrsků <a href="http://www.cuzk.cz/">RÚIAN</a> ' +
    '| Výsledky voleb <a href="http://volby.cz/opendata/opendata.htm">ČSÚ</a>' //,
  // id: 'examples.map-20v6611k'
}).addTo(map);

// pre-calculation of some values
for (var i = 0; i < data.features.length; i++) {
  props = data.features[i].properties;
  // props.ucast = props.plathl / props.volicu * 100;
  props.ratios = [];
  maxVotes = 0;
  maxParty = null;
  for (var j = 0; j < props.hlasy.length; j++) {
    props.ratios.push(props.hlasy[j] / props.plathl * 100);
    if (props.hlasy[j] > maxVotes) {
      maxVotes = props.hlasy[j];
      maxParty = partylist[j];
    } else if (props.hlasy[j] == maxVotes) {
      maxParty = null;
    }
  }
  props.winner = maxParty;
}

function rgbToArr(rgb) {
  var arr = [];
  var strs = rgb.slice(4,-1).split(',');
  for (var i = 0; i < 3; i++) {
    arr.push(parseInt(strs[i],10));
  }
  return arr;
}

var partyColorTuples = {};

for (var party in partyColors) {
  partyColorTuples[party] = rgbToArr(partyColors[party]);
}

// control that shows state info on hover
var info = L.control();

function getBasicInfo(props) {
  return '<table><tr><td colspan="3"><b>' + props.obec + '</b><br>okrsek ' + props.cislo + '</tr>';
}

function getFullInfo(props) {
  var rows = [];
  var sorted = [];
  for (var i = 0; i < props.hlasy.length; i++) {
    if (props.ratios[i] > 1) {
      sorted.push([partylist[i], props.hlasy[i], props.ratios[i]]);
    }
  }
  sorted.sort(sortVotes);
  for (var i = 0; i < sorted.length; i++) {
    rows.push('<tr><td>' + sorted[i][0] + '</td><td> <i style="background:' + getPartyColor(sorted[i][0]) + '; width:' + (maxWidth * sorted[i][2] / 100).toFixed(0) + 'px"></i></td><td class="minor">' + sorted[i][1] + ' (' + sorted[i][2].toFixed(1) + ' %)</td></tr>');
    //  + ' % vs. ' + partyResults[sorted[i][0]].toFixed(1) - celostatni vysledek
  }
  return rows.join('') + '</table><span class="bottomnote">(zobrazeny jen strany se ziskem &gt; 1 %)</span>';
}

function sortVotes(a, b) {
  return b[1] - a[1];
}

function getLessInfo(props) {
  return '<tr><td>Vítěz: </td><td>' + props.winner + '</td><td><i style="background:' + getPartyColor(props.winner) + '"></i></td></tr></table><span class="bottomnote">(klikni pro více informací)</span>';
}


info.onAdd = function (map) {
  this._div = L.DomUtil.create('div', 'info data');
  this.update();
  return this._div;
};

info.update = function (props, full) {
  if (props) {
    if (full) {
      cont = getBasicInfo(props) + getFullInfo(props);
    } else {
      cont = getBasicInfo(props) + getLessInfo(props);
    }
  } else {
    cont = 'Najeď nad okrsek';
  }
  this._div.innerHTML = '<h4>Volby do Zastupitelstva hl. m. Prahy 2018</h4>' + cont;
};

info.addTo(map);


// // get color depending on population density value
// function getUcastColor(d) {
  // // grades = [0, 10, 20, 30, 40, 50, 60, 80, 100]
  // return d > 100 ? '#4d004b' :
         // d > 80  ? '#810f7c' :
         // d > 60  ? '#88419d' :
         // d > 50  ? '#8c6bb1' :
         // d > 40   ? '#8c96c6' :
         // d > 30   ? '#9ebcda' :
         // d > 20   ? '#bfd3e6' :
         // d > 10   ? '#e0ecf4' :
                    // '#f7fcfd';
// }

function getPartyColor(p) {
  if (p) {
    col = partyColors[p];
    if (col) {
      return col;
    } else {
      return 'rgb(217,182,138)';
    }
  } else {
    return '#888888';
  }
}

var currentParty = null;

function getRatioColor(ratios, parties) {
  currentIndex = parties.indexOf(currentParty);
  if (currentIndex == -1) {
    return '#ffffff';
  } else {
    currentRatio = ratios[currentIndex];
    if (ratios[currentIndex] == 0.0) {
      return '#ffffff';
    } else {
      partyColor = partyColorTuples[currentParty];
      partyOverallRatio = partyResults[currentParty];
      if (!partyColor) {
        partyColor = [217,182,138];
      }
      if (!partyOverallRatio) {
        partyOverallRatio = 0.5; // SWAG, should not be used
      }
      // deduce color intensity by ratio
      return colorByRatio(partyColor, partyOverallRatio / currentRatio);
    }
  }
}

function arrToRGB(arr) {
  return 'rgb(' + arr.join(',') + ')';
}

function colorByRatio(main, ratio) {
  var arr = [];
  var sqrat = Math.pow(ratio, 0.4); // bring it closer to 1
  for (var i = 0; i < 3; i++) {
    arr.push((main[i] * sqrat).toFixed(0));
  }
  return arrToRGB(arr);
}


function styleWinner(feature) {
  return {
    weight: 1,
    opacity: 1,
    color: 'white',
    dashArray: '',
    fillOpacity: 0.6,
    fillColor: getPartyColor(feature.properties.winner)
  };
}

// function styleUcast(feature) {
  // return {
    // weight: 1,
    // opacity: 1,
    // color: 'white',
    // dashArray: '',
    // fillOpacity: 0.6,
    // fillColor: getUcastColor(feature.properties.ucast)
  // };
// }

function styleRatio(feature) {
  return {
    weight: 1,
    opacity: 1,
    color: 'white',
    dashArray: '',
    fillOpacity: 0.6,
    fillColor: getRatioColor(feature.properties.ratios, partylist)
  };
}

function highlightFeature(e) {
  var layer = e.target;

  layer.setStyle({
    weight: 2,
    color: 'black',
    dashArray: '',
    fillOpacity: 0.7
  });

  if (!L.Browser.ie && !L.Browser.opera) {
    layer.bringToFront();
  }

  info.update(layer.feature.properties, true);
}

var geojson;
var defaultStyle = styleWinner;

function resetHighlight(e) {
  geojson.resetStyle(e.target);
  geojson.setStyle(defaultStyle);
  info.update();
}

function allInfoFeature(e) {
  info.update(e.target.feature.properties, true);
}

function zoomToFeature(e) {
  map.fitBounds(e.target.getBounds());
}

function onEachFeature(feature, layer) {
  layer.on({
    mouseover: highlightFeature,
    mouseout: resetHighlight,
    click: allInfoFeature,
    dblclick: zoomToFeature
  });
}

geojson = L.geoJson(data, {
  style: defaultStyle,
  onEachFeature: onEachFeature
}).addTo(map);


// var ucastlegend = L.control({position: 'bottomleft'});

// ucastlegend.onAdd = function (map) {

  // var div = L.DomUtil.create('div', 'info legend ucastlegend'),
    // grades = [0, 10, 20, 30, 40, 50, 60, 80, 100],
    // labels = [],
    // from, to;

  // for (var i = 0; i < grades.length; i++) {
    // from = grades[i];
    // to = grades[i + 1];

    // labels.push(
      // '<i style="background:' + getUcastColor(from + 1) + '"></i> ' +
      // from + (to ? '&ndash;' + to : '+') + ' %');
  // }

  // div.innerHTML = '<h4>Volební účast</h4>' + labels.join('<br>');
  // return div;
// };

// ucastlegend.addTo(map);

var partylegend = L.control({position: 'bottomleft'});

partylegend.onAdd = function (map) {

  var div = L.DomUtil.create('div', 'info legend partylegend');
  var labels = [];
  
  for (party in partyColors) {
    labels.push(
      '<i style="background:' + getPartyColor(party) + '"></i> ' +
      party + ' <span class="minor">(' + partyResults[party] + ' %)</span>');
  }
  labels.push('<i style="background:' + getPartyColor('whatever') + '"></i> jiná strana');
  labels.push('<i style="background:' + getPartyColor(null) + '"></i> remíza</span>');

  div.innerHTML = '<h4>Strany</h4>' + labels.join('<br>');
  return div;
};

var currentlegend = partylegend;

currentlegend.addTo(map);

var topStyles = {
  "Vítězové" : "winners"
  // "Účast" : "ucast"
};

var bottomStyles = {};

var styleFunctions = {
  "winners" : styleWinner
  // "ucast" : styleUcast
};

var styleLegends = {
  "winners" : partylegend
  // "ucast" : ucastlegend
};


for (var party in partyColors) {
  bottomStyles[party] = party;
  styleFunctions[party] = styleRatio;
  styleLegends[party] = L.control({position: 'bottomleft'});
  styleLegends[party].onAdd = function (map) {
    var div = L.DomUtil.create('div', 'info legend ucastlegend'),
      grades = [0.25, 0.5, 0.75, 1, 1.5, 2, 4],
      labels = [];

    for (var i = 0; i < grades.length; i++) {
      labels.push(
        '<i style="background:' + colorByRatio(partyColorTuples[currentParty], 1 / grades[i]) + '"></i> ' + (partyResults[currentParty] * grades[i]).toFixed(1) + ' % <span class="minor">(' +
        grades[i] * 100 + ' % prům.)</span>');
        // from + (to ? '&ndash;' + to : '+') + ' %');
    }
    labels.push('<span class="minor">(stupnice je plynulá)</span>');
    div.innerHTML = '<h4>Výsledek strany ' + currentParty + '</h4>' + labels.join('<br>');
    return div;
  };
}

var layerswitch = layerControl(topStyles, bottomStyles, "winners", {position: 'bottomright'});

layerswitch.choose = function (choice) {
  if (currentParty != choice) {
    currentParty = choice;
    defaultStyle = styleFunctions[choice];
    geojson.setStyle(defaultStyle);
    currentlegend.removeFrom(map);
    currentlegend = styleLegends[choice];
    currentlegend.addTo(map);
  }
}
layerswitch.addTo(map);