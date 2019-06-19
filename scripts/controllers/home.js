canibike.controller('home', function($scope, $localStorage) {
    //LocalStorage scope handler (via ngStorage)
    //Set default values if there are not any already
    $scope.$storage = $localStorage.$default({
        
        selectedActivity: "bike",
        selectedTime: "towork",

        storedLat: '',
        storedLong: '',

        thresholds: {
            bike: {
                highTemp: 80,
                lowTemp: 70,
                precipProb: 0.20,
                windSpeed: 3
            },
            run: {
                highTemp: 70,
                lowTemp: 60,
                precipProb: 0.15,
                windSpeed: 5
            },
            walk: {
                highTemp: 60,
                lowTemp: 50,
                precipProb: 0.10,
                windSpeed: 10
            }
        },

        times: {
            towork: {
                start: 8,
                end: 17,
                type: 'split'
            },
            toschool: {
                start: 7,
                end: 15,
                type: 'split'
            },
            today: {
                start: 8,
                end: 19,
                type: 'block'
            }
        }
        
    });

    //Geolocation variables -- set via localStorage -- change in locate() function later
    /*
    $scope.latString = $scope.$storage.storedLat;
    $scope.longString = $scope.$storage.storedLong;
    */

    //Weather variables -- undefined for now
    var darkSkyResponseObject;
    var hourlyWeatherArray;

    //Current Activity/Time variables -- set via scope.storage
    /*
    $scope.selectedActivity = $scope.$storage.selectedActivity;
    $scope.selectedTime = $scope.$storage.selectedTime;
    */

    //Set "Selected Activity Thresholds" using values stored in scope.storage
    
    /*
    $scope.selectedActivityThresholds = {
        highTemp: $scope.$storage.thresholds[$scope.$storage.selectedActivity].highTemp,
        lowTemp: $scope.$storage.thresholds[$scope.$storage.selectedActivity].lowTemp,
        precipProb: $scope.$storage.thresholds[$scope.$storage.selectedActivity].precipProb,
        windSpeed: $scope.$storage.thresholds[$scope.$storage.selectedActivity].windSpeed
    };
    */

    //Set "Selected Activity Thresholds" using values stored in scope.storage
    /*
    $scope.selectedActivityTimes = {
        start: $scope.$storage.times[$scope.$storage.selectedTime].start,
        end: $scope.$storage.times[$scope.$storage.selectedTime].end,
        type: $scope.$storage.times[$scope.$storage.selectedTime].type
    };
    */

    //CanI Result variables -- empty for now
    $scope.result = {
        canI: '',
        reasonCondition: '',
        reasonTime: ''
    };

    //*******WATCHERS**********

    //SELECTED ACTIVITY
    $scope.$watch('$scope.$storage.selectedActivity', function(newVal, oldVal) {
        //$scope.$storage.selectedActivity = newVal;
        console.log('Changed Selected Activity to ' + $scope.$storage.selectedActivity);
    });

    //SELECTED TIME


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

    function checkCanI(hourlyWeatherArray, $scope) {
        
        console.log("***CURRENTLY SELECTED ACTIVITY***");
        console.log("Activity: " + $scope.$storage.selectedActivity);
        console.log("Time: " + $scope.$storage.selectedTime);
        
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
                if((hitStartHour == false) && (thisTimeObject.getHours() == $scope.$storage.times[$scope.$storage.selectedTime].start)) {
                    //set flag to true so we don't do this again...
                    hitStartHour = true;

                    //Check start conditions against high temperature threshold
                    if(element.temperature > $scope.$storage.thresholds[$scope.$storage.selectedActivity].highTemp) {
                        $scope.result.canI = 'No';
                        $scope.result.reasonCondition = 'tempHigh';
                        $scope.result.reasonTime = 'start';
                        console.log("CANT! " + $scope.result.reasonCondition + " at " + $scope.result.reasonTime);
                    } 
                    //Check start conditions against low temperature threshold
                    else if(element.temperature < $scope.$storage.thresholds[$scope.$storage.selectedActivity].lowTemp) {
                        $scope.result.canI = 'No';
                        $scope.result.reasonCondition = 'tempLow';
                        $scope.result.reasonTime = 'start';
                        console.log("CANT! " + $scope.result.reasonCondition + " at " + $scope.result.reasonTime);
                    }

                    if(element.windSpeed > $scope.$storage.thresholds[$scope.$storage.selectedActivity].windSpeed) {
                        $scope.result.canI = 'No';
                        $scope.result.reasonCondition = 'windSpeed';
                        $scope.result.reasonTime = 'start';
                        console.log("CANT! " + $scope.result.reasonCondition + " at " + $scope.result.reasonTime);
                    }

                    if(element.precipProbability > $scope.$storage.thresholds[$scope.$storage.selectedActivity].precipProb) {
                        $scope.result.canI = 'No';
                        $scope.result.reasonCondition = 'precipProb';
                        $scope.result.reasonTime = 'start';
                        console.log("CANT! " + $scope.result.reasonCondition + " at " + $scope.result.reasonTime);
                    }

                };

                //If we have not yet hit our "end hour" and then we do...
                if((hitEndHour == false) && (thisTimeObject.getHours() == $scope.$storage.times[$scope.$storage.selectedTime].end)) {
                    //set flag to true so we don't do this again...
                    hitEndHour = true;

                    //Check end conditions against high temperature threshold
                    if(element.temperature > $scope.$storage.thresholds[$scope.$storage.selectedActivity].highTemp) {
                        $scope.result.canI = 'No';
                        $scope.result.reasonCondition = 'tempHigh';
                        $scope.result.reasonTime = 'end';
                        console.log("CANT! " + $scope.result.reasonCondition + " at " + $scope.result.reasonTime);
                    } 
                    //Check end conditions against low temperature threshold
                    else if(element.temperature < $scope.$storage.thresholds[$scope.$storage.selectedActivity].lowTemp) {
                        $scope.result.canI = 'No';
                        $scope.result.reasonCondition = 'tempLow';
                        $scope.result.reasonTime = 'end';
                        console.log("CANT! " + $scope.result.reasonCondition + " at " + $scope.result.reasonTime);
                    }

                    if(element.windSpeed > $scope.$storage.thresholds[$scope.$storage.selectedActivity].windSpeed) {
                        $scope.result.canI = 'No';
                        $scope.result.reasonCondition = 'windSpeed';
                        $scope.result.reasonTime = 'end';
                        console.log("CANT! " + $scope.result.reasonCondition + " at " + $scope.result.reasonTime);
                    }

                    if(element.precipProbability > $scope.$storage.thresholds[$scope.$storage.selectedActivity].precipProb) {
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


