// var map = L.map('map').setView([49.75, 15.25], 8)
var map = L.map('map').setView([50.05, 14.45], 12);


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


function rgbToArr(rgb) {
  var arr = [];
  var strs = rgb.slice(4,-1).split(',');
  for (var i = 0; i < 3; i++) {
    arr.push(parseInt(strs[i],10));
  }
  return arr;
}

// control that shows state info on hover
var info = L.control();

function getBasicInfo(props) {
  return '<table><tr><td colspan="3"><b>MČ ' + props.mc + '</b><br>okrsek ' + props.okrsek + '</tr>';
}

function getFullInfo(props) {
  var maxValue = props.ps_perc_2018 > props.ps_perc_2022 ? props.ps_perc_2018 : props.ps_perc_2022;
  var rows = [
    '<tr><td>2022</td><td> <i style="background:rgb(255,224,0); width:' + (maxWidth / maxValue * props.ps_perc_2022).toFixed(0) + 'px"></i></td><td class="minor">' + props.ps_2022 + '/' + props.total_2022 + ' (' + (props.ps_perc_2022 * 100).toFixed(1) + ' %)</td></tr>',
    '<tr><td>2018</td><td> <i style="background:rgb(224,224,224); width:' + (maxWidth / maxValue * props.ps_perc_2018).toFixed(0) + 'px"></i></td><td class="minor">' + props.ps_2018 + '/' + props.total_2018 + ' (' + (props.ps_perc_2018 * 100).toFixed(1) + ' %)</td></tr>',
  ];
  return rows.join('') + '</table>';
}

function sortVotes(a, b) {
  return b[1] - a[1];
}

info.onAdd = function (map) {
  this._div = L.DomUtil.create('div', 'info data');
  this.update();
  return this._div;
};

info.update = function (props, full) {
  if (props) {
    cont = getBasicInfo(props) + getFullInfo(props);
  } else {
    cont = 'Najeď nad okrsek';
  }
  this._div.innerHTML = '<h4>Volby do Zastupitelstva hl. m. Prahy 2022 vs 2018</h4>' + cont;
};

info.addTo(map);


// // get color depending on population density value
function getDiffColor(d) {
return d < -0.1 ? '#a50026' :
d < -0.05 ? '#d73027' :
d < -0.02 ? '#f46d43' :
d < -0.01 ? '#fdae61' :
d < 0.0 ? '#fee08b' :
d < 0.01 ? '#d9ef8b' :
d < 0.02 ? '#a6d96a' :
d < 0.05 ? '#66bd63' :
d < 0.1 ? '#1a9850' :
 '#006837';
}


function styleDiff(feature) {
  return {
    weight: 1,
    opacity: 1,
    color: 'white',
    dashArray: '',
    fillOpacity: 0.6,
    fillColor: getDiffColor(feature.properties.perc_diff)
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
var defaultStyle = styleDiff;

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


var difflegend = L.control({position: 'bottomleft'});

difflegend.onAdd = function (map) {

  var div = L.DomUtil.create('div', 'info legend difflegend'),
    grades = [-1, -0.1, -0.05, -0.02, -0.01, 0, 0.01, 0.02, 0.05, 0.1],
    labels = [],
    from, to;

  for (var i = 0; i < grades.length; i++) {
    from = grades[i];
    to = grades[i + 1];

    labels.push(
      '<i style="background:' + getDiffColor((from + to) / 2) + '"></i> ' +
      (from * 100).toFixed(0) + ((i < grades.length - 1) ? ' až ' + (to * 100).toFixed(0) : '+') + ' %');
  }

  div.innerHTML = '<h4>Rozdíl výsledku PS 2022 vs 2018</h4>' + labels.join('<br>');
  return div;
};

difflegend.addTo(map);
