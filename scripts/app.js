'use strict';

var canibike = angular.module('canibike', ['ui.router', 'ngStorage', 'ngAnimate']);

//ROUTES
canibike.config(function($stateProvider, $urlRouterProvider) {

    $stateProvider
        .state('home', {
            url: '/home',
            templateUrl: '/controllers/home.html',
            controller: 'home'
        });

    $urlRouterProvider.otherwise('/home'); 
});

