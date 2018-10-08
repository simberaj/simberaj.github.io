LayerControl = L.Control.extend({
	options: {
		collapsed: true,
		position: 'topright',
		autoZIndex: true
	},

	initialize: function (choicesTop, choicesBottom, defaultChoice, options) {
		L.setOptions(this, options);

		this._choices = {};
    this._defaultChoice = defaultChoice;
		this._lastZIndex = 0;
		this._handlingClick = false;

		for (var i in choicesTop) {
			this._addChoice(choicesTop[i], i);
		}

		for (var i in choicesBottom) {
			this._addChoice(choicesBottom[i], i, true);
		}

	},

	onAdd: function (map) {
		this._initLayout();
		this._update();

		// map
		    // .on('layeradd', this._onLayerChange, this)
		    // .on('layerremove', this._onLayerChange, this);

		return this._container;
	},

	// onRemove: function (map) {
		// map
		    // .off('layeradd', this._onLayerChange, this)
		    // .off('layerremove', this._onLayerChange, this);
	// },

	// addBaseLayer: function (layer, name) {
		// this._addLayer(layer, name);
		// this._update();
		// return this;
	// },

	// addOverlay: function (layer, name) {
		// this._addLayer(layer, name, true);
		// this._update();
		// return this;
	// },

	// removeLayer: function (layer) {
		// var id = L.stamp(layer);
		// delete this._layers[id];
		// this._update();
		// return this;
	// },

	_initLayout: function () {
		var className = 'leaflet-control-layers',
		    container = this._container = L.DomUtil.create('div', className);

		//Makes this work on IE10 Touch devices by stopping it from firing a mouseout event when the touch is released
		container.setAttribute('aria-haspopup', true);

		if (!L.Browser.touch) {
			L.DomEvent
				.disableClickPropagation(container)
				.disableScrollPropagation(container);
		} else {
			L.DomEvent.on(container, 'click', L.DomEvent.stopPropagation);
		}

		var form = this._form = L.DomUtil.create('form', className + '-list');

		if (this.options.collapsed) {
			if (!L.Browser.android) {
				L.DomEvent
				    .on(container, 'mouseover', this._expand, this)
				    .on(container, 'mouseout', this._collapse, this);
			}
			var link = this._layersLink = L.DomUtil.create('a', className + '-toggle', container);
			link.href = '#';
			link.title = 'Layers';

			if (L.Browser.touch) {
				L.DomEvent
				    .on(link, 'click', L.DomEvent.stop)
				    .on(link, 'click', this._expand, this);
			}
			else {
				L.DomEvent.on(link, 'focus', this._expand, this);
			}
			//Work around for Firefox android issue https://github.com/Leaflet/Leaflet/issues/2033
			L.DomEvent.on(form, 'click', function () {
				setTimeout(L.bind(this._onInputClick, this), 0);
			}, this);

			this._map.on('click', this._collapse, this);
			// TODO keyboard accessibility
		} else {
			this._expand();
		}

		this._topList = L.DomUtil.create('div', className + '-top', form);
		this._separator = L.DomUtil.create('div', className + '-separator', form);
		this._bottomList = L.DomUtil.create('div', className + '-bottom', form);

		container.appendChild(form);
	},

	_addChoice: function (choice, name, bottom) {

		this._choices[choice] = {
			choice: choice,
			name: name,
			bottom: bottom
		};

		// if (this.options.autoZIndex && layer.setZIndex) {
			// this._lastZIndex++;
			// layer.setZIndex(this._lastZIndex);
		// }
	},

	_update: function () {
		if (!this._container) {
			return;
		}

		this._topList.innerHTML = '';
		this._bottomList.innerHTML = '';

		var topPresent = false,
		    bottomPresent = false,
		    i, obj;

		for (i in this._choices) {
			obj = this._choices[i];
			this._addItem(obj);
			topPresent = topPresent || !obj.bottom;
			bottomPresent = bottomPresent || obj.bottom;
		}

		this._separator.style.display = (topPresent && bottomPresent) ? '' : 'none';
	},

	// _onLayerChange: function (e) {
		// var obj = this._layers[L.stamp(e.layer)];

		// if (!obj) { return; }

		// if (!this._handlingClick) {
			// this._update();
		// }

		// var type = obj.overlay ?
			// (e.type === 'layeradd' ? 'overlayadd' : 'overlayremove') :
			// (e.type === 'layeradd' ? 'baselayerchange' : null);

		// if (type) {
			// this._map.fire(type, obj);
		// }
	// },

	// IE7 bugs out if you create a radio dynamically, so you have to do it this hacky way (see http://bit.ly/PqYLBe)
	_createRadioElement: function (name, checked) {

		var radioHtml = '<input type="radio" class="leaflet-control-layers-selector" name="' + name + '"';
		if (checked) {
			radioHtml += ' checked="checked"';
		}
		radioHtml += '/>';

		var radioFragment = document.createElement('div');
		radioFragment.innerHTML = radioHtml;

		return radioFragment.firstChild;
	},

	_addItem: function (obj) {
		var label = document.createElement('label'),
		    input,
		    checked = (obj.choice == this._defaultChoice);

    input = this._createRadioElement('leaflet-base-layers', checked);
		input.choice = obj.choice;
		L.DomEvent.on(input, 'click', this._onInputClick, this);

		var name = document.createElement('span');
		name.innerHTML = ' ' + obj.name;

		label.appendChild(input);
		label.appendChild(name);

		var container = obj.bottom ? this._bottomList : this._topList;
		container.appendChild(label);

		return label;
	},

	_onInputClick: function () {
		var i, input, obj,
		    inputs = this._form.getElementsByTagName('input'),
		    inputsLen = inputs.length;

		this._handlingClick = true;

		for (i = 0; i < inputsLen; i++) {
			input = inputs[i];
			if (input.checked) {
				this.choose(input.choice); // TODO - change style: this._map.addLayer(obj.layer);
			}
		}

		this._handlingClick = false;
		this._refocusOnMap();
	},

	_expand: function () {
		L.DomUtil.addClass(this._container, 'leaflet-control-layers-expanded');
	},

	_collapse: function () {
		this._container.className = this._container.className.replace(' leaflet-control-layers-expanded', '');
	}
});

layerControl = function (choicesTop, choicesBottom, defaultChoice, options) {
	return new LayerControl(choicesTop, choicesBottom, defaultChoice, options);
};
