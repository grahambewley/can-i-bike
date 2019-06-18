canibike.controller('home', function($scope, $http) {

    $scope.latString = '';
    $scope.longString = '';

    $scope.activityThresholds = [
        {
            name: 'bike',
            highTempThreshold: '90',
            lowTempThreshold: '45',
            windSpeedThreshold: '15'
        },
        {
            name: 'run',
            highTempThreshold: '80',
            lowTempThreshold: '35',
            windSpeedThreshold: '10'
        }
    ];

    $scope.activityTimes = [
        {
            name: 'work',
            weatherCheckType: 'spread',
            startHour: '8',
            endHour: '17'
        },
        {
            name: 'school',
            weatherCheckType: 'spread',
            startHour: '7',
            endHour: '15',
        }
    ];
    
    //TO-DO: make thresholds change dynamically
    $scope.selectedActivityThresholds = {
        name: 'bike',
        highTempThreshold: '90',
        lowTempThreshold: '45',
        windSpeedThreshold: '15'
    };

    //TO-DO: make times change dynamically
    $scope.selectedActivityTimes = {
        name: 'work',
        weatherCheckType: 'spread',
        startHour: '8',
        endHour: '17'
    };
    
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
                //Take response string and parse into JSON object
                var responseObject = JSON.parse(res);
                //Send response to handler function
                processResponse(responseObject);
            }
        });
        
    }

    function processResponse(responseObject) {
       
        //Remains false until we've looped through and hit our activity "start time" for the first time
        //Keeps us from hitting start time twice in the 48 hours of response data
        var hitStartHour = false;

        var hourlyArray = responseObject.hourly.data;
        console.log(hourlyArray);

        console.log("Current activity start: " + $scope.selectedActivityTimes.startHour);
        console.log("Current activity end: " + $scope.selectedActivityTimes.endHour);
        
        hourlyArray.forEach(element => {
            //Make a new data object at epoch 0 -- 00:00 Jan 1, 1970
            thisTimeObject = new Date(0);
            //Add the epoch time (in seconds) that we get from the API
            thisTimeObject.setUTCSeconds(element.time); 
            
            //If we have not yet hit our "start hour" and then we do...
            if((hitStartHour == false) && (thisTimeObject.getHours() == $scope.selectedActivityTimes.startHour)) {
                //set flag to true so we don't do this again...
                hitStartHour = true;

                console.log("Temp at start hour: " + element.temperature);
                console.log("Wind at start hour: " + element.windSpeed);
            };
        });
    }
});


