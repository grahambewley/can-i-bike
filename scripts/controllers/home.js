canibike.controller('home', function($scope, $localStorage) {
    
    //LocalStorage scope handler (via ngStorage)
    //This will store most of the variables we're using, since we want these to persist between sessions
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
                highTemp: 100,
                lowTemp: 10,
                precipProb: 0.90,
                windSpeed: 50
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

    //Weather variables -- undefined for now
    var darkSkyResponseObject;
    $scope.hourlyWeatherArray;

    //CanI Result variables -- empty for now
    $scope.result = {
        canI: '',
        reasonCondition: '',
        reasonTime: ''
    };

    //Big Word -- Displays the result after running the weather-checking function
    $scope.bigWord = '';

    //*******WATCHERS**********

    //SELECTED ACTIVITY
    $scope.$watchGroup(['$storage.selectedActivity', '$storage.selectedTime'], function(newVal, oldVal) {
        console.log("Changed Selection, emptying $scope.result...");
        $scope.result = {
            canI: '',
            reasonCondition: '',
            reasonTime: ''
        };
        
        //Watch is triggered immediately on page load
        //This if.. statement keeps the checkCanI function from running until the weather data has loaded
        if($scope.hourlyWeatherArray != undefined) {
            console.log("..and running checkCanI function again")
            $scope.checkCanI();
        
        }
    });


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

                $scope.hourlyWeatherArray = darkSkyResponseObject.hourly.data;
                console.log("***NARROW DOWN TO HOURLY WEATHER ONLY***");
                console.log($scope.hourlyWeatherArray);

                //Use weather data and check "Can I" function to test against thresholds
                $scope.$evalAsync($scope.checkCanI());
            }
        });
        
    }

    //function checkCanI(hourlyWeatherArray, $scope) {
    $scope.checkCanI = function() {
         
        console.log("* * * Entered checkCanI Function * * *");
        console.log("***CURRENTLY SELECTED ACTIVITY***");
        console.log("Activity: " + $scope.$storage.selectedActivity);
        console.log("Time: " + $scope.$storage.selectedTime);
        
        //Remains false until we've looped through and hit our activity "start time" for the first time
        //Keeps us from hitting start time twice in the 48 hours of response data
        var hitStartHour = false;
        //Same thing for "end hour"...
        var hitEndHour = false;

        //For each hour in the forecast...
        $scope.hourlyWeatherArray.forEach(element => {
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
                    $scope.result.canI = 'No.';
                    $scope.result.reasonCondition = 'tempHigh';
                    $scope.result.reasonTime = 'start';
                    console.log("Setting result.canI to NO -> " + $scope.result.reasonCondition + " at " + $scope.result.reasonTime);
                } 
                //Check start conditions against low temperature threshold
                else if(element.temperature < $scope.$storage.thresholds[$scope.$storage.selectedActivity].lowTemp) {
                    $scope.result.canI = 'No.';
                    $scope.result.reasonCondition = 'tempLow';
                    $scope.result.reasonTime = 'start';
                    console.log("Setting result.canI to NO -> " + $scope.result.reasonCondition + " at " + $scope.result.reasonTime);
                }

                if(element.windSpeed > $scope.$storage.thresholds[$scope.$storage.selectedActivity].windSpeed) {
                    $scope.result.canI = 'No.';
                    $scope.result.reasonCondition = 'windSpeed';
                    $scope.result.reasonTime = 'start';
                    console.log("Setting result.canI to NO -> " + $scope.result.reasonCondition + " at " + $scope.result.reasonTime);
                }

                if(element.precipProbability > $scope.$storage.thresholds[$scope.$storage.selectedActivity].precipProb) {
                    $scope.result.canI = 'No.';
                    $scope.result.reasonCondition = 'precipProb';
                    $scope.result.reasonTime = 'start';
                    console.log("Setting result.canI to NO -> " + $scope.result.reasonCondition + " at " + $scope.result.reasonTime);
                }

            };

            //If we have not yet hit our "end hour" and then we do...
            if((hitEndHour == false) && (thisTimeObject.getHours() == $scope.$storage.times[$scope.$storage.selectedTime].end)) {
                //set flag to true so we don't do this again...
                hitEndHour = true;

                //Check end conditions against high temperature threshold
                if(element.temperature > $scope.$storage.thresholds[$scope.$storage.selectedActivity].highTemp) {
                    $scope.result.canI = 'No.';
                    $scope.result.reasonCondition = 'tempHigh';
                    $scope.result.reasonTime = 'end';
                    console.log("Setting result.canI to NO -> " + $scope.result.reasonCondition + " at " + $scope.result.reasonTime);
                } 
                //Check end conditions against low temperature threshold
                else if(element.temperature < $scope.$storage.thresholds[$scope.$storage.selectedActivity].lowTemp) {
                    $scope.result.canI = 'No.';
                    $scope.result.reasonCondition = 'tempLow';
                    $scope.result.reasonTime = 'end';
                    console.log("Setting result.canI to NO -> " + $scope.result.reasonCondition + " at " + $scope.result.reasonTime);
                }

                if(element.windSpeed > $scope.$storage.thresholds[$scope.$storage.selectedActivity].windSpeed) {
                    $scope.result.canI = 'No.';
                    $scope.result.reasonCondition = 'windSpeed';
                    $scope.result.reasonTime = 'end';
                    console.log("Setting result.canI to NO -> " + $scope.result.reasonCondition + " at " + $scope.result.reasonTime);
                }

                if(element.precipProbability > $scope.$storage.thresholds[$scope.$storage.selectedActivity].precipProb) {
                    $scope.result.canI = 'No.';
                    $scope.result.reasonCondition = 'precipProb';
                    $scope.result.reasonTime = 'end';
                    console.log("Setting result.canI to NO -> " + $scope.result.reasonCondition + " at " + $scope.result.reasonTime);
                }

            }
        });
                
        if($scope.result.canI == '') {
            console.log("Setting result.canI to YES");
            $scope.result.canI = 'Yes.';
        }
    }
});


