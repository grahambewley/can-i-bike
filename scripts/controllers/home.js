canibike.controller('home', function($scope, $http) {

    $scope.latString = '';
    $scope.longString = '';

    $scope.workHours = {
        start: 8,
        end: 17
    };

    $scope.schoolHours = {
        start: 7,
        end: 15
    }

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
                processResponse(res);
            }
        });
        
    }

    function processResponse(res) {
        var currentTime = new Date();
        console.log("Work Start: " + $scope.workHours.start);
        console.log("Work End: " + $scope.workHours.end);
        console.log("Current Date Obj: " + currentTime);

    }
});


