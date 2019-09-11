'use strict';

var canibike = angular.module('canibike', ['ui.router', 'ngStorage', 'ngAnimate']);

//ROUTES
canibike.config(function($stateProvider, $urlRouterProvider, $locationProvider) {

    $stateProvider
        .state('home', {
            url: '/home',
            templateUrl: '/views/controllers/home.html',
            controller: 'home'
        });

    $urlRouterProvider.otherwise('/home'); 

    // use the HTML5 History API
    $locationProvider.html5Mode(true);
});

