/*	google maps API key: AIzaSyAT4hPk1A042B1lW5gjL78aY9zmTwLZNDM
	google maps API implementation
	------------------------------------------------------------
*/
// // jQuery function to get JSON via AJAX call using JSON-P
// var neighborhoods = $.ajax("http://www.jordancolehunt.co.za/data_udacity_app/data.json", {
// 	dataType: "jsonp",
// 	jsonp: "callback",
// 	jsonpCallback: "jsonCallback",
// 	type: "GET"
// 	});
// function jsonCallback(data) {
// 	console.log(data);
// }
function init() {

	// function to initialise google map
	var map;
	function initMap() {
		// initialise map with coords and zoom level
		var durban = new google.maps.LatLng(-29.728146, 31.083943);
		map = new google.maps.Map(document.getElementById('map'), {
			center: durban,
			zoom: 11
		});
		console.log(map);
	}

	initMap();

	// modelview
	function myAppModelView(map) {
		var self = this;
		self.markers = ko.observableArray([]);
		self.infowindow = ko.observableArray([]);
		self.neighborhoodsData = ko.observableArray([]);
		self.mapData = map;
		console.log(map);

		// jQuery function to get JSON and parse it into JS Object literal
		// for loop required to push each object into array sequentially
		/*
			1. TO DO: refactor for loop into forEach method
			2. Change error handling to notify user about failure
		*/

		$.getJSON("js/data/data.json", function(data){
			var length = data.neighborhoods.length;
			for (var i = 0; i < length; i++){
				self.neighborhoodsData.push(data.neighborhoods[i]);
			}
			console.log('succeeded in loading neighborhood data');
		}).fail(function() {
			console.log('failed to load neighborhood data');
		});

		// implement simple marker with timeout
		self.addMarkerWithTimeout = function (position, timeout, index) {
			window.setTimeout(function() {
				// create markers

				self.markers.push(new google.maps.Marker({
					position: position,
					map: self.mapData,
					title: position.title,
					animation: google.maps.Animation.DROP
				}))
				// create click listeners for each marker based on index
				self.markers()[index].addListener('click', function(){
				self.infowindow()[index].open(self.mapData, self.markers()[index]);
				});
			}, timeout);
		}

		// function to clear markers - working
		self.clearMarkers = function() {
			for (var i = 0; i < self.markers().length; i++) {
				self.markers()[i].setMap(null);
			}
		self.markers([]);
		}

		// function to init markers
		self.drop = function() {
			// first clear all markers
			self.clearMarkers();
			// loop over array of objects containing lat and long key:values and create markers
			for (var i = 0; i < self.neighborhoodsData().length; i++) {
				// create infowindow objects for each marker
				self.infowindow.push(new google.maps.InfoWindow({
					content: self.neighborhoodsData()[i].content
				}));
				// the following function creates markers with initial delay (timeout to execution), passing in i
				self.addMarkerWithTimeout(self.neighborhoodsData()[i], i * 200, i);
			}
		}
	}

	ko.applyBindings(new myAppModelView(map));
};