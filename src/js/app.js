// refactor code so that var length = self.neighborhoodsData().length; is global

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
		self.infowindow = ko.observableArray([]);
		self.neighborhoodsData = ko.observableArray([]);
		self.mapData = map;
		self.searchOptions = {
			keys: ['spotName', 'address'],
			id: 'ID' // the ID is the same is the object's index PLUS 1
		};
		self.currentSearchValue = ko.observable('');

		// constructor for location object
		function NeighborhoodSpot(lat, lng, name, content, address, id) {
			this.lat = lat;
			this.lng = lng;
			this.spotName = name;
			this.content = content;
			this.address = address;
			this.visible = ko.observable(true);
			this.isSelected = ko.observable(false);
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
				self.neighborhoodsData.push(new NeighborhoodSpot(data.neighborhoods[i].lat, data.neighborhoods[i].lng, data.neighborhoods[i].name, data.neighborhoods[i].content, data.neighborhoods[i].address, i + 1));
				console.log('------data check------ \n' + self.neighborhoodsData()[i].ID + '\n----------------------');
			}
			self.dataLength = self.neighborhoodsData().length;
			console.log('succeeded in loading neighborhood data');
		}).fail(function() {
			console.log('failed to load neighborhood data');
		});



		// implement simple marker with timeout
		self.addMarkerWithTimeout = function (NeighborhoodSpotObject, timeout, index) { // NeighborhoodSpotObject expects self.neighborhoodsData()[i]
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
					// when marker is clicked, set animation to bounce
					self.animateBounce(NeighborhoodSpotObject);
					// when marker is clicked, corresponding list item must highlight
					self.styleItem(NeighborhoodSpotObject);
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

		self.clickListItem = function(that) {
			this.isSelected(true); // is this necessary? maybe not unless functionality is implemented another way
			self.animateBounce(that);
			self.styleItem(that);

		}

		// function to change marker's animation when selected
		self.animateBounce = function(that) {
			// check to see if function has object parameter
			if (that instanceof NeighborhoodSpot == true) {
				// assign self2 to passed-in NeighborhoodSpot object
				var self2 = that;
				// if the marker clicked on is animating, exit function
				if (self2.marker.getAnimation() == 1) return;
				// else, call to removeAnimation function to remove all animations
				else self.removeAnimations();
				// then set current object's marker to bounce
				self2.marker.setAnimation(google.maps.Animation.BOUNCE);
				// exit function
				return;
			}
		}

		// function to remove marker animations
		self.removeAnimations = function() {
			var length = self.neighborhoodsData().length;
			var obj = self.neighborhoodsData();
			// loop through Neighborhood marker objects
			for (var i = 0; i < length; i++) {
				obj[i].marker.setAnimation(null);
			}
		}

		// close all info windows
		self.closeInfoWindows = function() {
			var length = self.neighborhoodsData().length;
			var obj = self.neighborhoodsData();
			// loop through Neighborhood marker objects
			for (var i = 0; i < length; i++) {
				obj[i].infowindow.close();
			}
		}

		// apply style to selected list item
		self.styleItem = function(that) {
			//var length = self.neighborhoodsData().length;
			var index = self.neighborhoodsData.indexOf(that);
			var node = $('#' + index);
			console.log(node.css('backgroundColor'));
			// if list item is already red/selected, exit function
			if (node.css('backgroundColor') === 'rgb(255, 0, 0)') {
				return;
			}
			// else, if it isn't red, clear all other background colors and make current selection red
			else {
				// loop over items
				var node2;
				for (var i = 0; i < self.dataLength; i++) {
					node2 = $('#' + i);
					node2.css("background-color", 'inherit');
				}
				node.css("background-color", "red");
			}
		}

		// self.tempObject = [
		// 		{"lat": -29.748909, "lng": 31.058702, "spotName": "Home", "content": "this is my home", "address": "62 Chartwell Drive", "ID": 1},
		// 		{"lat": -29.726029, "lng": 31.084880, "spotName": "The George", "content": "this is my watering hole", "address": "12 Chartwell Drive", "ID": 2},
		// 		{"lat": -29.785487, "lng": 31.020924, "spotName": "@ Coffee", "content": "this is where I get pumped", "address": "89 North Coast Road", "ID": 3}
		// ];

		// search functionality --- http://kiro.me/projects/fuse.html
		self.searchFunc = function() { // this library freaks out when an object's ID is 0, so all IDs are index + 1
			console.log('search array: \n' + self.neighborhoodsData());
			var f = new Fuse(self.neighborhoodsData(), self.searchOptions)
			var result = f.search(self.currentSearchValue());
			console.log(result);
		}

		self.searchButtonClick = function() {
			console.log(self.currentSearchValue());
			console.log(self.searchOptions);
			self.searchFunc();
		}
	}

	ko.applyBindings(new myAppModelView(map));
};