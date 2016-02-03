// google maps API key: AIzaSyAT4hPk1A042B1lW5gjL78aY9zmTwLZNDM
// Flickr API key 270d3453be92cea8224422aa6ea6f882

var loadingMessageInGlobal = '';

function init() {

	var map;

	// function to initialise google map
	function initMap() {
		// initialise map with coords and zoom level
		var SF = new google.maps.LatLng(37.775897, -122.442238);
		map = new google.maps.Map(document.getElementById('map'), {
			center: SF,
			zoom: 12
		});
	}

	// initialise google map
	initMap();

	// modelview
	function myAppModelView(map) {

		var self = this;
		self.infowindow = ko.observableArray([]);
		self.neighborhoodsData = ko.observableArray([]);
		self.searchCategories = ko.observableArray(['','Food', 'Coffee', 'Drinks']);
		self.mapData = map;
		self.searchOptions = {
			keys: ['spotName'],
			id: 'ID' // the ID is the same is the object's index PLUS 1
		};
		self.searchOptions2 = { // this is used for filter/category search results
			keys: ['filter'],
			id: 'ID'
		};
		self.currentSearchValue = ko.observable('');
		self.currentDropSearchValue = ko.observable(''); // initially nothing is selected
		self.searchResults = ko.observable([]);
		self.mapIsLoading = ko.observable(true);
		self.loadingMessage = ko.observable('PLEASE WAIT FOR MAP TO LOAD');

		// function to update currentDropSearchValue
		self.updateDropSearchValue = function(data) {
			console.log(data);
		};

		// constructor for location object
		function NeighborhoodSpot(lat, lng, name, contentData, address, filter, id) {
			this.lat = lat;
			this.lng = lng;
			this.spotName = name;
			this.flickrURL = '';
			this.flickTag = '';
			this.additionalContent = '<br><br>' + address + '<br><br>' +
				'<a href="https://maps.googleapis.com/maps/api/streetview?size=300x300&location=' +
				this.lat + ',' + this.lng + '&fov=90&heading=235&pitch=10&key=AIzaSyAT4hPk1A042B1lW5gjL78aY9zmTwLZNDM" target="_blank">' +
				'Click here to see a Street View of ' + this.spotName + '</a>';
			this.contentData = contentData;
			this.content = this.contentData + this.additionalContent;
			this.address = address;
			this.visible = ko.observable(true); // starts off visible
			this.isSelected = ko.observable(false); // starts off not selected
			this.ID = id;
			this.marker = null;
			this.filter = filter;
			this.flickrResponseObject = null;

		}

		// jQuery function to get JSON and parse it into JS Object literal
		// for loop required to push each object into array sequentially
		/*
			1. TO DO: refactor for loop into forEach method
		*/

		$.getJSON("js/data/data.json", function(data){
			var length = data.neighborhoods.length;
			for (var i = 0; i < length; i++){
				self.neighborhoodsData.push(new NeighborhoodSpot(data.neighborhoods[i].lat, data.neighborhoods[i].lng, data.neighborhoods[i].name, data.neighborhoods[i].content, data.neighborhoods[i].address, data.neighborhoods[i].filter, i + 1));
				console.log('------data check------ \n' + self.neighborhoodsData()[i].ID + '\n----------------------');
			}
			self.dataLength = self.neighborhoodsData().length;
			console.log('succeeded in loading neighborhood data');
		});

		// marker click event handler
		self.markerClick = function(that) {
			// when marker is clicked, close all other infowindows and open specific infowindow
			var index = self.neighborhoodsData.indexOf(that);
			self.closeInfoWindows();
			self.neighborhoodsData()[index].infowindow.open(self.mapData, self.neighborhoodsData()[index].marker);
			var length = self.neighborhoodsData().length;
			var url = 'https://www.flickr.com/services/rest/?method=flickr.photos.search&api_key=270d3453be92cea8224422aa6ea6f882&format=json&nojsoncallback=1&sort=relevance&per_page=1&tags=' + self.neighborhoodsData()[index].spotName;
			var jqXHRresponse;
			var jqxhr = $.ajax({
				url: url,
				dataType: "json"
			}).done(function(data){
				self.neighborhoodsData()[index].flickrResponseObject = data;
				// flickr image url
				var obj =  self.neighborhoodsData()[index];
				obj.flickrURL = 'https://farm'+ obj.flickrResponseObject.photos.photo[0].farm +
				'.staticflickr.com/' +
				obj.flickrResponseObject.photos.photo[0].server + '/' +
				obj.flickrResponseObject.photos.photo[0].id + '_' + obj.flickrResponseObject.photos.photo[0].secret +
				'.jpg';
				obj.flickTag = '<br><a target="_blank" href="' + obj.flickrURL + '">Click this to see Flickr image relating to ' + obj.spotName + '</a>';
				obj.infowindow.setContent(obj.contentData + obj.additionalContent + obj.flickTag);
			}).fail(function(){
				console.log('error fetching flickr data');
				// infowindow fail message
				var obj =  self.neighborhoodsData()[index];
				obj.flickTag = '<br>Could not load Flickr picture. Please try click Neighborhood spot again';
				obj.infowindow.setContent(obj.contentData + obj.additionalContent + obj.flickTag);
			});
		};

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
				NeighborhoodSpotObject.marker = marker();
				// create click listeners for each marker based on index
				NeighborhoodSpotObject.marker.addListener('click', function(){
					// marker click handler
					self.markerClick(NeighborhoodSpotObject);
					// when marker is selected, animate with bounce
					self.animateBounce(NeighborhoodSpotObject);
					// when marker is clicked, corresponding list item must highlight
					//self.styleItem(NeighborhoodSpotObject);
					// when marker is clicked, unselect other markers before marking current as true
					self.switchSelectedMarkers();
					// when marker is clicked, update isSelcted value to true
					self.neighborhoodsData()[index].isSelected(true);
					// set infowindow links
				});
			}, timeout);
		};

		// function to unselect markers
		self.switchSelectedMarkers = function() {
			for (var i = 0; i < self.dataLength; i++){
				if (self.neighborhoodsData()[i].isSelected()){
					self.neighborhoodsData()[i].isSelected(false);
				}
			}
		};

		// function to clear markers
		self.clearMarkers = function() {
			// get length of self.neighborhoodsData() observ array
			var length = self.neighborhoodsData().length;
			// loop over array
			for (var i = 0; i < length; i++) {
				// check to see if markers exist
				if (self.neighborhoodsData()[i].marker !== null){
					// if they do, set marker's map property to null
					self.neighborhoodsData()[i].marker.setMap(null);
				}
			}
		};

		self.reactivateMarkers = function(i) {
			self.neighborhoodsData()[i].marker.setMap(self.mapData);
		};

		// function to init markers and list items
		self.init = function() {
			// clear all markers
			self.clearMarkers();
			// loop over array of NeighborhoodSpot objects
			for (var i = 0; i < self.neighborhoodsData().length; i++) {
				// create infowindow objects for each marker as property on NeighborhoodSpot object in observ array
				var infowin = new google.maps.InfoWindow({
					content: self.neighborhoodsData()[i].content
				});
				// extend NeighborhoodSpot object with property for infowindow object
				self.neighborhoodsData()[i].infowindow = infowin;
				// the following function creates markers with initial delay (timeout to execution), passing in 1) NeighborhoodSpot object 2) delay algorithm 3) index
				self.addMarkerWithTimeout(self.neighborhoodsData()[i], i * 200, i);
			}
		};

		self.clickListItem = function(that) {
			if (!that.isSelected()) {
				self.closeInfoWindows();
				self.switchSelectedMarkers();
			}
			that.isSelected(true);
			self.markerClick(that);
			self.animateBounce(that);
		};

		// function to change marker's animation when selected
		self.animateBounce = function(that) {
			// check to see if function has object parameter
			if (that instanceof NeighborhoodSpot === true) {
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
		};

		// function to remove marker animations
		self.removeAnimations = function() {
			var length = self.neighborhoodsData().length;
			var obj = self.neighborhoodsData();
			// loop through Neighborhood marker objects
			for (var i = 0; i < length; i++) {
				obj[i].marker.setAnimation(null);
			}
		};

		// close all info windows
		self.closeInfoWindows = function() {
			var length = self.neighborhoodsData().length;
			var obj = self.neighborhoodsData();
			// loop through Neighborhood marker objects
			for (var i = 0; i < length; i++) {
				obj[i].infowindow.close();
			}
		};

		// function to clear current search results
		self.clearSearch = function() {
			self.currentDropSearchValue('');
			self.currentSearchValue('');
			self.searchButtonClick();
			// set all items/markers to DESELECTED
			var length = self.neighborhoodsData().length;
			for (var i = 0; i < length; i++){
				self.neighborhoodsData()[i].isSelected(false);
			}
		};

		// search functionality --- http://kiro.me/projects/fuse.html
		// text input search functionality
		// this function searches through NeighborhoodSpot objects using a search object listing search keys and returns an array with identifiers
		self.searchFunc = function() { // this library freaks out when an object's ID is 0, so all IDs are index + 1
			var f = new Fuse(self.neighborhoodsData(), self.searchOptions);
			self.searchResults(f.search(self.currentSearchValue()));
		};

		// drop-down search functionality
		self.searchFunc2 = function() {
			var f = new Fuse(self.neighborhoodsData(), self.searchOptions2);
			self.searchResults(f.search(self.currentDropSearchValue()));
		};

		// function to execute text input search
		self.searchButtonClick = function() {
			self.searchFunc();
			self.setVisible();
			self.currentDropSearchValue('');
		};

		// function to execute drop-down/category search
		self.searchButtonClick2 = function() {
			self.searchFunc2();
			self.setVisible();
			self.currentSearchValue('');
		};

		// function which uses the array of searchResults which contains index values to set objects to visible
		self.setVisible = function() {
			var length = self.searchResults().length;
			var indexValue;
			// if there are search results i.e. user has search string
			if (length > 0) {
				self.closeInfoWindows();
				// set all to false before setting search results to true
				for (var i = 0; i < self.dataLength; i++) {
					self.neighborhoodsData()[i].visible(false);
				}
				self.clearMarkers();
				// set search result items to true/visible
				for (var x = 0; x < length; x++) {
					indexValue = (self.searchResults()[x] - 1);
					self.neighborhoodsData()[indexValue].visible(true);
					self.reactivateMarkers(indexValue);
				}
			}
			// else return all items if user enters no string and clicks search/presses enter
			else {
				self.closeInfoWindows();
				// set all markers to visible, reset list item styling
				for (var o = 0; o < self.dataLength; o++) {
					self.neighborhoodsData()[o].visible(true);
					self.reactivateMarkers(o);
				}
			}
		};

		$(window).load(function(){
			self.init();
			self.mapIsLoading(false);
		});
	}
	ko.applyBindings(new myAppModelView(map));
}
