canibike.controller('home', function($scope, $http) {

    $scope.toWorkTimes

    $scope.latString = '';
    $scope.longString = '';

    $scope.locate = function() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(getWeatherFromPosition);
        } 
        else { 
            console.log("Geolocation isn't supported by your browser");
        }
    }

    function getWeatherFromPosition(position) {
        console.log("Lat: " + position.coords.latitude); 
        console.log("Long: " + position.coords.longitude);
    
        $scope.latString = position.coords.latitude.toFixed(4);
        $scope.longString = position.coords.longitude.toFixed(4);

        //TO-DO: Fix CORS error and stop using proxy
        //TO-DO: Make API Key secret
        $http.get("https://cors-anywhere.herokuapp.com/https://api.darksky.net/forecast/*****KEY HERE********/" + $scope.latString + "," + $scope.longString + "?exclude=minutely")
        .then(function(response) {
            var responseObj = response.data;
            console.log(responseObj);

            
        });
        
    }
});


