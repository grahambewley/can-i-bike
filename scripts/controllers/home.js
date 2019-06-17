canibike.controller('home', function($scope, $http) {

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
    
        var lat = position.coords.latitude.toString();
        var long = position.coords.longitude.toString();
        $scope.latString = lat;
        $scope.longString = long;
        
        $.ajax({      
            "crossDomain": true,
            "url": "/getWeatherByPosition.php?lat="+lat+"&long="+long,
            "method": "GET",
            "success": function(res){
                console.log(res);
            }
        });
        
    }
});


