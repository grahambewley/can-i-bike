'use strict';

//TODO: Name your AngularJS app
var myAppName = angular.module('myAppName', ['ui.router'])

//ROUTES
myAppName.config(function($stateProvider, $urlRouterProvider) {

    $stateProvider
        .state('myControllerName', {
            url: '/myControllerName',
            templateUrl: '/views/controllers/myControllerName.html',
            controller: 'myControllerName'
        });

        $urlRouterProvider.otherwise('/myControllerName');
});

