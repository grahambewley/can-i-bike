'use strict';

window.onload = function() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(logPosition);
    } 
    else { 
        console.log("Geolocation isn't supported by your browser");
    }

    function logPosition(position) {
        console.log("Lat: " + position.coords.latitude); 
        console.log("Long: " + position.coords.longitude);
      }
}


var canibike = angular.module('canibike', ['ui.router'])

//ROUTES
canibike.config(function($stateProvider, $urlRouterProvider) {

    $stateProvider
        .state('home', {
            url: '/home',
            templateUrl: '/views/controllers/home.html',
            controller: 'home'
        });

        $urlRouterProvider.otherwise('/home');
});

