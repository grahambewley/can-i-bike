'use strict';

var canibike = angular.module('canibike', ['ui.router']);

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

