canibike.controller('home', function($scope, $localStorage) {

    //LocalStorage scope handler (via ngStorage)
    $scope.$storage = $localStorage;

    //Geolocation variables
    $scope.latString = '';
    $scope.longString = '';

    //Weather variables
    var darkSkyResponseObject;
    var hourlyWeatherArray;

    //Current Activity variables
    $scope.selectedActivity = "bike";
    $scope.selectedTime = "towork";

    //CanI Result variables
    $scope.result = {
        canI: '',
        reasonCondition: '',
        reasonTime: ''
    };


    $scope.savedThresholds = [
        {
            name: 'bike',
            highTempThreshold: 90,
            lowTempThreshold: 45,
            precipProbThreshold: 0.15,
            windSpeedThreshold: 15
        },
        {
            name: 'run',
            highTempThreshold: 80,
            lowTempThreshold: 30,
            precipProbThreshold: 0.15,
            windSpeedThreshold: 15
        }
    ];


    $scope.savedTimes = [
        {
            name: 'towork',
            activityTimeType: 'split',
            startHour: '8',
            endHour: '17'
        },
        {
            name: 'toschool',
            activityTimeType: 'split',
            startHour: '7',
            endHour: '15',
        },
        {
            name: 'today',
            activityTimeType: 'block',
            startHour: '7',
            endHour: '15',
        }
    ];
    
    /******* SELECTED ACTIVITY THRESHOLDS *******/

    //TO-DO: make thresholds change dynamically
    $scope.selectedActivityThresholds = {
        name: 'bike',
        highTempThreshold: 90,
        lowTempThreshold: 45,
        precipProbThreshold: 0.15,
        windSpeedThreshold: 15
    };

    //TO-DO: make times change dynamically
    $scope.selectedActivityTimes = {
        name: 'towork',
        activityTimeType: 'split',
        startHour: '8',
        endHour: '17'
    };
    

    //*******WATCHERS**********
    //THRESHOLDS

    //Watch Low Temp threshold for changes
    //$scope.$watch('selectedActivityThresholds.lowTempThreshold')
    

    //Determine geolocation if browser supports it, then call getWeatherFromPosition function as a callback
    $scope.locate = function() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(getWeatherFromPosition);
        } 
        else { 
            console.log("Geolocation isn't supported by your browser");
        }
    }

    function getWeatherFromPosition(position) {
        console.log("Getting weather for current position...");
        console.log("***CURRENT POSITION***");
        console.log("Lat: " + position.coords.latitude); 
        console.log("Long: " + position.coords.longitude);
    
        var lat = position.coords.latitude.toString();
        var long = position.coords.longitude.toString();
        $scope.latString = lat;
        $scope.longString = long;
        
        //AJAX call to server-side API query, returns a weather forecast
        $.ajax({      
            "crossDomain": true,
            "url": "/getWeatherByPosition.php?lat="+lat+"&long="+long,
            "method": "GET",
            "success": function(res){
                //Take response string and parse into JSON object
                darkSkyResponseObject = JSON.parse(res);
                console.log("***FULL WEATHER DATA RETURNED***");
                console.log(darkSkyResponseObject);

                hourlyWeatherArray = darkSkyResponseObject.hourly.data;
                console.log("***NARROW DOWN TO HOURLY WEATHER ONLY***");
                console.log(hourlyWeatherArray);

                //Send response to handler function
                checkCanI(hourlyWeatherArray, $scope);
            }
        });
        
    }

    function checkCanI(darkSkyResponseObject, $scope) {
        
        console.log("***CURRENTLY SELECTED ACTIVITY***");
        console.log("Activity: " + $scope.selectedActivity);
        console.log("Time: " + $scope.selectedTime);
        
        //Remains false until we've looped through and hit our activity "start time" for the first time
        //Keeps us from hitting start time twice in the 48 hours of response data
        var hitStartHour = false;
        //Same thing for "end hour"...
        var hitEndHour = false;

        $scope.$apply(function() {
            //For each hour in the forecast...
            hourlyWeatherArray.forEach(element => {
                //Make a new data object at epoch 0 -- 00:00 Jan 1, 1970
                thisTimeObject = new Date(0);
                //Add the epoch time (in seconds) that we get from the API
                thisTimeObject.setUTCSeconds(element.time); 
                
                //If we have not yet hit our "start hour" and then we do...
                if((hitStartHour == false) && (thisTimeObject.getHours() == $scope.selectedActivityTimes.startHour)) {
                    //set flag to true so we don't do this again...
                    hitStartHour = true;

                    //Check start conditions against high temperature threshold
                    if(element.temperature > $scope.selectedActivityThresholds.highTempThreshold) {
                        $scope.result.canI = 'No';
                        $scope.result.reasonCondition = 'tempHigh';
                        $scope.result.reasonTime = 'start';
                        console.log("CANT! " + $scope.result.reasonCondition + " at " + $scope.result.reasonTime);
                    } 
                    //Check start conditions against low temperature threshold
                    else if(element.temperature < $scope.selectedActivityThresholds.lowTempThreshold) {
                        $scope.result.canI = 'No';
                        $scope.result.reasonCondition = 'tempLow';
                        $scope.result.reasonTime = 'start';
                        console.log("CANT! " + $scope.result.reasonCondition + " at " + $scope.result.reasonTime);
                    }

                    if(element.windSpeed > $scope.selectedActivityThresholds.windSpeedThreshold) {
                        $scope.result.canI = 'No';
                        $scope.result.reasonCondition = 'windSpeed';
                        $scope.result.reasonTime = 'start';
                        console.log("CANT! " + $scope.result.reasonCondition + " at " + $scope.result.reasonTime);
                    }

                    if(element.precipProbability > $scope.selectedActivityThresholds.precipProbThreshold) {
                        $scope.result.canI = 'No';
                        $scope.result.reasonCondition = 'precipProb';
                        $scope.result.reasonTime = 'start';
                        console.log("CANT! " + $scope.result.reasonCondition + " at " + $scope.result.reasonTime);
                    }

                };

                //If we have not yet hit our "end hour" and then we do...
                if((hitEndHour == false) && (thisTimeObject.getHours() == $scope.selectedActivityTimes.endHour)) {
                    //set flag to true so we don't do this again...
                    hitEndHour = true;

                    //Check end conditions against high temperature threshold
                    if(element.temperature > $scope.selectedActivityThresholds.highTempThreshold) {
                        $scope.result.canI = 'No';
                        $scope.result.reasonCondition = 'tempHigh';
                        $scope.result.reasonTime = 'end';
                        console.log("CANT! " + $scope.result.reasonCondition + " at " + $scope.result.reasonTime);
                    } 
                    //Check end conditions against low temperature threshold
                    else if(element.temperature < $scope.selectedActivityThresholds.lowTempThreshold) {
                        $scope.result.canI = 'No';
                        $scope.result.reasonCondition = 'tempLow';
                        $scope.result.reasonTime = 'end';
                        console.log("CANT! " + $scope.result.reasonCondition + " at " + $scope.result.reasonTime);
                    }

                    if(element.windSpeed > $scope.selectedActivityThresholds.windSpeedThreshold) {
                        $scope.result.canI = 'No';
                        $scope.result.reasonCondition = 'windSpeed';
                        $scope.result.reasonTime = 'end';
                        console.log("CANT! " + $scope.result.reasonCondition + " at " + $scope.result.reasonTime);
                    }

                    if(element.precipProbability > $scope.selectedActivityThresholds.precipProbThreshold) {
                        $scope.result.canI = 'No';
                        $scope.result.reasonCondition = 'precipProb';
                        $scope.result.reasonTime = 'end';
                        console.log("CANT! " + $scope.result.reasonCondition + " at " + $scope.result.reasonTime);
                    }

                }
            });
        });
        
        $scope.$apply(function() {
            if($scope.result.canI == '') {
                console.log("Setting result.canI to YES");
                $scope.result.canI = 'Yes.';
            } else {
                $scope.result.canI = 'No.';
            }
        });
    }
});


