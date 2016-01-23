/*	google maps API key: AIzaSyAT4hPk1A042B1lW5gjL78aY9zmTwLZNDM
	google maps API implementation
	------------------------------------------------------------
*/
var map;
var markers = [];
var infowindow = [];
// create array of neighborhoods  areas
var neighborhoods = [
{lat: -29.748909, lng: 31.058702, title: "fuck", content: 'hi'},
{lat: -29.726029, lng: 31.084880, title: "yeah", content: 'how'},
{lat: -29.785487, lng: 31.020924, title: "bro", content: 'you'}
];
// function to initialise google map
function initMap() {
	// initialise map with coords and zoom level
	var durban = new google.maps.LatLng(-29.728146, 31.083943);
	map = new google.maps.Map(document.getElementById('map'), {
		center: durban,
		zoom: 11
	});
}
// implement simple marker with timeout
function addMarkerWithTimeout(position, timeout) {
	window.setTimeout(function() {
		markers.push(new google.maps.Marker({
		position: position,
		map: map,
		title: position.title,
		animation: google.maps.Animation.DROP
		}))
		//console.log(markers.length - 1)
	}, timeout);

}
// function to clear markers
function clearMarkers() {
	for (var i = 0; i < markers.length; i++) {
		markers[i].setMap(null);
	}
	markers = [];
}
// function to init markers
function drop() {
	// first clear all markers
	clearMarkers();
	// loop over array of objects containing lat and long key:values and create markers
	for (var i = 0; i < neighborhoods.length; i++) {
		// the following function creates markers with initial delay (timeout to execution)
		addMarkerWithTimeout(neighborhoods[i], i * 200);
		// create infowindow objects for each marker
		infowindow.push(new google.maps.InfoWindow({
			content: neighborhoods[i].content
		}));
		// IIFE passing in current i variable as j. Timeout function ensures listener is added after markers are created
		(function(j){
			window.setTimeout(function(){
					markers[j].addListener('click', function(){
					infowindow[j].open(map, markers[j]);
				});
			}, j * 250);
		})(i)
	}
}
