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

	var map;

	// function to initialise google map
	function initMap() {
		// initialise map with coords and zoom level
		var durban = new google.maps.LatLng(-29.728146, 31.083943);
		map = new google.maps.Map(document.getElementById('map'), {
			center: durban,
			zoom: 11
		});
	}

	// initialise google map
	initMap();

	// modelview
	function myAppModelView(map) {

		var self = this;
		//self.markers = ko.observableArray([]);
		self.infowindow = ko.observableArray([]);
		self.neighborhoodsData = ko.observableArray([]);
		self.mapData = map;

		// constructor for location object
		function NeighborhoodSpot(lat, lng, name, content, address, id) {
			this.lat = lat;
			this.lng = lng;
			this.spotName = name;
			this.content = content;
			this.address = address;
			this.visible = ko.observable(true);
			this.ID = id;
			this.marker = null;
		}

		// jQuery function to get JSON and parse it into JS Object literal
		// for loop required to push each object into array sequentially
		/*
			1. TO DO: refactor for loop into forEach method
			2. Change error handling to notify user about failure
		*/

		$.getJSON("js/data/data.json", function(data){
			var length = data.neighborhoods.length;
			for (var i = 0; i < length; i++){
				self.neighborhoodsData.push(new NeighborhoodSpot(data.neighborhoods[i].lat, data.neighborhoods[i].lng, data.neighborhoods[i].name, data.neighborhoods[i].content, data.neighborhoods[i].address, i));
			}
			console.log('succeeded in loading neighborhood data');
			// log to debug neighborhoodData ko.oA
			console.log(self.neighborhoodsData());
		}).fail(function() {
			console.log('failed to load neighborhood data');
		});

		// implement simple marker with timeout
		self.addMarkerWithTimeout = function (NeighborhoodSpotObject, timeout, index) {
			//console.log('test0');
			//console.log(NeighborhoodSpotObject);
			//console.log(self.mapData);
			// set timeout before creating marker to create delayed drop effect
			window.setTimeout(function() {
				// create markers
				var marker = ko.observable(new google.maps.Marker({
					position: NeighborhoodSpotObject,
					map: self.mapData,
					title: NeighborhoodSpotObject.name,
					animation: google.maps.Animation.DROP
				}));
				// extend NeighborhoodSpot object with marker property
				self.neighborhoodsData()[index].marker = marker();
				// create click listeners for each marker based on index
				self.neighborhoodsData()[index].marker.addListener('click', function(){
					// when marker is clicked, open infowindow
					self.neighborhoodsData()[index].infowindow.open(self.mapData, self.neighborhoodsData()[index].marker);
				});
			}, timeout);
		}

		// function to clear markers
		self.clearMarkers = function() {
			// get length of self.neighborhoodsData() observ array
			var length = self.neighborhoodsData().length;
			// loop over array
			for (var i = 0; i < length; i++) {
				// check to see if markers exist
				if (self.neighborhoodsData()[i].marker != null){
					// if they dont, set marker's map property to null
					self.neighborhoodsData()[i].marker.setMap(null);
				}
			}
		}

		// function to init markers
		self.drop = function() {
			// clear all markers
			self.clearMarkers();
			// loop over array of NeighborhoodSpot objects
			for (var i = 0; i < self.neighborhoodsData().length; i++) {
				// create infowindow objects for each marker as property on NeighborhoodSpot object in observ array
				var infowin = new google.maps.InfoWindow({
					content: self.neighborhoodsData()[i].content
				})
				// extend NeighborhoodSpot object with property for infowindow object
				self.neighborhoodsData()[i].infowindow = infowin;
				// the following function creates markers with initial delay (timeout to execution), passing in 1) NeighborhoodSpot object 2) delay algorithm 3) index
				self.addMarkerWithTimeout(self.neighborhoodsData()[i], i * 200, i);
			}
		}

		// function to change marker's animation when selected
		self.animateBounce = function() {
			// assign current marker's index to index variable
			var index = self.neighborhoodsData().indexOf(this);
			// if the marker clicked on is animating, exit function
			if (this.marker.getAnimation() == 1) return;
			// else, call to removeAnimation function
			else self.removeAnimations();
			// then set current object's marker to bounce
			this.marker.setAnimation(google.maps.Animation.BOUNCE);
		}

		// function to remove all marker animations
		self.removeAnimations = function(index) {
			var length = self.neighborhoodsData().length;
			var obj = self.neighborhoodsData();
			// loop through Neighborhood marker objects
			for (var i = 0; i < length; i++) {
				obj[i].marker.setAnimation(null);
			}
		}
	}

	ko.applyBindings(new myAppModelView(map));
};