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
                highTemp: 85,
                lowTemp: 45,
                precipProb: 20,
                windSpeed: 15,
                humidity: 60
            },
            run: {
                highTemp: 80,
                lowTemp: 40,
                precipProb: 30,
                windSpeed: 10,
                humidity: 50
            },
            walk: {
                highTemp: 90,
                lowTemp: 55,
                precipProb: 30,
                windSpeed: 10,
                humidity: 70
            }
        },

        times: {
            towork: {
                start: 8,
                end: 17,
                type: 'commute'
            },
            toschool: {
                start: 7,
                end: 15,
                type: 'commute'
            },
            today: {
                start: 8,
                end: 19,
                type: 'block'
            },
            thismorning: {
                start: 7,
                end: 12,
                type: 'block'
            },
            thisafternoon: {
                start: 12,
                end: 18,
                type: 'block'
            },
            thisevening: {
                start: 18,
                end: 22,
                type: 'block'
            }
        }
        
    });

    //Stores the full JSON object returned by Dark Sky API
    var darkSkyResponseObject;
    //Stores an array containing the hourly forecast only, chopped from darkSkyResponseObject
    $scope.hourlyWeatherArray;
    //Stores the full reverse-geocode JSON object returned by Mapquest API
    var revGeocodeObject;


    //Stores the full hourly forecast object for data we want to display on screen
    $scope.relevantWeatherData = [];
    //Stores the formatted weather data we will display on screen
    $scope.displayedWeatherData = [];

    //CanI Result variable -- empty for now
    $scope.canI = '';
    
    //Will hold data about the things we can't 
    $scope.triggers = [];

    //*******WATCHERS**********

    //Watch main user inputs -- selectedActivity and selectedTime
    $scope.$watchGroup(['$storage.selectedActivity', '$storage.selectedTime'], function(newVal, oldVal) {
        
        clearWeatherData();

        //Watch is triggered immediately on page load
        //This if statement keeps the checkCanI function from running until the weather data has loaded
        if($scope.hourlyWeatherArray != undefined) {
            $scope.checkCanI();
        }
    });

    //TO-DO: Watch settings bar -- trigger timeout (to catch multiple arrow clicks) then run canI function


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
        //TO-DO: Trigger some sort of weather check based on the $localStorage version of lat and long -- so we don't need that to come back first every time
        console.log("***CURRENT POSITION: LAT: " + position.coords.latitude + ", LONG: " + position.coords.longitude);
    
        $scope.latString = position.coords.latitude.toString();
        $scope.longString = position.coords.longitude.toString();
            
        //AJAX call to server-side proxy -- queries API, returns a weather forecast
        $.ajax({      
            "crossDomain": true,
            "url": "/getWeatherByPosition.php?lat="+$scope.latString+"&long="+$scope.longString,
            "method": "GET",
            "success": function(res){
                //Take response string and parse into JSON object
                darkSkyResponseObject = JSON.parse(res);
                console.log("***FULL WEATHER DATA RETURNED:");
                console.log(darkSkyResponseObject);

                $scope.hourlyWeatherArray = darkSkyResponseObject.hourly.data;
                console.log("***NARROW DOWN TO HOURLY WEATHER ONLY:");
                console.log($scope.hourlyWeatherArray);

                //Use weather data and check "Can I" function to test against thresholds
                //Use evalAsync to trigger another digest cycle -- grabbing weather data eats up the first one...
                $scope.$evalAsync($scope.checkCanI());    
                
            }
        });

        // DISPLAYING ADDRESS ON PAGE
        //Mapquest API allows max of 6 digits after decimal point
        let lat = position.coords.latitude.toFixed(6);
        let long = position.coords.longitude.toFixed(6);

        console.log("About to Reverse Geocode using lat: " + lat + " and long: " + long );
        //AJAX call to get address from geographical position
        $.ajax({      
            "crossDomain": true,
            "url": "/geocode.php?lat="+lat+"&long="+long,
            "method": "GET",
            "success": function(res2){
                //Take response string and parse into JSON object
                revGeocodeObject = JSON.parse(res2);
                console.log("***GEOCODE DATA RETURNED:");
                console.log(revGeocodeObject);

                //Store city and state to be displayed for the user
                let street = revGeocodeObject.results[0].locations[0].street;
                let city = revGeocodeObject.results[0].locations[0].adminArea5;
                let state = revGeocodeObject.results[0].locations[0].adminArea3;

                $scope.address = street + ', ' + city + ', ' + state;
                console.log("Address we got was: " + $scope.address);
            }
        });
        
    }

    function clearWeatherData() {
        //Clear our result fields
        $scope.canI = '';
        $scope.triggers = [];

        //Clear the arrays that store our forecast data to be displayed
        $scope.relevantWeatherData = [];
        $scope.displayedWeatherData = [];
    }

    $scope.checkCanI = function() {
        //Determine what 'time type' we're looking at (e.g. commute, block)
        var timeType = $scope.$storage.times[$scope.$storage.selectedTime].type;

        switch(timeType) {
            case 'commute':
                $scope.checkCanI_commute();
                break;
            case 'block':
                $scope.checkCanI_block();
                break;
        }

    }

    //Function for handling 'commute' style time types like "to work" or "to school"
    $scope.checkCanI_commute = function() {
         
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

                //Store the weather data for this hour to be formatted and displayed later
                $scope.relevantWeatherData.push(element);

                //Check start-time temperature against the highTemp threshold the user has set for this activity...
                if(element.temperature > $scope.$storage.thresholds[$scope.$storage.selectedActivity].highTemp) {
                    //If the temparture is too high, set the "Can I?" result to No
                    $scope.canI = 'No.';
                    $scope.triggers.push({
                        time: element.time,
                        reason: 'temp'
                    });
                } else if(element.temperature < $scope.$storage.thresholds[$scope.$storage.selectedActivity].lowTemp) {
                    $scope.canI = 'No.';
                    $scope.triggers.push({
                        time: element.time,
                        reason: 'temp'
                    });
                }

                if(element.windSpeed > $scope.$storage.thresholds[$scope.$storage.selectedActivity].windSpeed) {
                    $scope.canI = 'No.';
                    $scope.triggers.push({
                        time: element.time,
                        reason: 'wind'
                    });
                }

                //Precipitation probability is stored in a more user-friendly percentage format, so divide by 100
                if(element.precipProbability > ($scope.$storage.thresholds[$scope.$storage.selectedActivity].precipProb / 100)) {
                    $scope.canI = 'No.';
                    $scope.triggers.push({
                        time: element.time,
                        reason: 'precip'
                    });
                }

                //Humidity is stored in a more user-friendly percentage format, so divide by 100
                if(element.humidity > ($scope.$storage.thresholds[$scope.$storage.selectedActivity].humidity / 100)) {
                    $scope.canI = 'No.';
                    $scope.triggers.push({
                        time: element.time,
                        reason: 'humid'
                    });
                }

            };

            //...Same thing for the "end hour", but also make sure we've hit the "start hour" as well
            if((hitStartHour == true) && (hitEndHour == false) && (thisTimeObject.getHours() == $scope.$storage.times[$scope.$storage.selectedTime].end)) {
                hitEndHour = true;

                //Store the weather data for this hour to be formatted and displayed later
                $scope.relevantWeatherData.push(element);

                if(element.temperature > $scope.$storage.thresholds[$scope.$storage.selectedActivity].highTemp) {
                    $scope.canI = 'No.';
                    $scope.triggers.push({
                        time: element.time,
                        reason: 'temp'
                    });
                } else if(element.temperature < $scope.$storage.thresholds[$scope.$storage.selectedActivity].lowTemp) {
                    $scope.canI = 'No.';
                    $scope.triggers.push({
                        time: element.time,
                        reason: 'temp'
                    });
                }
                
                if(element.windSpeed > $scope.$storage.thresholds[$scope.$storage.selectedActivity].windSpeed) {
                    $scope.canI = 'No.';
                    $scope.triggers.push({
                        time: element.time,
                        reason: 'wind'
                    });
                }
                
                if(element.precipProbability > ($scope.$storage.thresholds[$scope.$storage.selectedActivity].precipProb / 100)) {
                    $scope.canI = 'No.';
                    $scope.triggers.push({
                        time: element.time,
                        reason: 'precip'
                    });
                }

                if(element.humidity > ($scope.$storage.thresholds[$scope.$storage.selectedActivity].humidity / 100)) {
                    $scope.canI = 'No.';
                    $scope.triggers.push({
                        time: element.time,
                        reason: 'humid'
                    });
                }
            }
        });
        
        //If result is still empty, set "Can I?" to Yes
        if($scope.canI == '') {
            console.log("Setting result.canI to YES");
            $scope.canI = 'Yes.';
        }

        formatWeatherData();

    }

    //Function for handling 'block' style time types like "this afternoon" or "today"
    $scope.checkCanI_block = function() {
        $scope.hourlyWeatherArray.forEach(element => {
            
            let todaysDate = new Date().getDate();
            console.info("Today's Date is " + todaysDate);
            
            //Make a new data object at epoch 0 -- 00:00 Jan 1, 1970
            let thisTimeObject = new Date(0);
            //Add the epoch time (in seconds) that we get from the API
            thisTimeObject.setUTCSeconds(element.time); 

            //If thisTimeObject is for today's date 
            //AND the hour is greater than or equal to the start hour of the selected Time
            //AND the hour is less than or equal to the end hour of the selected Time
            if((thisTimeObject.getDate() == todaysDate) 
                && (thisTimeObject.getHours() >= $scope.$storage.times[$scope.$storage.selectedTime].start)
                && (thisTimeObject.getHours() <= $scope.$storage.times[$scope.$storage.selectedTime].end)) {

                 //Store the weather data for this hour to be formatted and displayed later
                 $scope.relevantWeatherData.push(element);

                if(element.temperature > $scope.$storage.thresholds[$scope.$storage.selectedActivity].highTemp) {
                    $scope.canI = 'No.';
                    $scope.triggers.push({
                        time: element.time,
                        reason: 'temp'
                    });
                } else if(element.temperature < $scope.$storage.thresholds[$scope.$storage.selectedActivity].lowTemp) {
                    $scope.canI = 'No.';
                    $scope.triggers.push({
                        time: element.time,
                        reason: 'temp'
                    });
                }
                
                if(element.windSpeed > $scope.$storage.thresholds[$scope.$storage.selectedActivity].windSpeed) {
                    $scope.canI = 'No.';
                    $scope.triggers.push({
                        time: element.time,
                        reason: 'wind'
                    });
                }
                
                if(element.precipProbability > ($scope.$storage.thresholds[$scope.$storage.selectedActivity].precipProb / 100)) {
                    $scope.canI = 'No.';
                    $scope.triggers.push({
                        time: element.time,
                        reason: 'precip'
                    });
                }

                if(element.humidity > ($scope.$storage.thresholds[$scope.$storage.selectedActivity].humidity / 100)) {
                    $scope.canI = 'No.';
                    $scope.triggers.push({
                        time: element.time,
                        reason: 'humid'
                    });
                }
            }
        });

        //If result is still empty, set "Can I?" to Yes
        if($scope.canI == '') {
            console.log("Setting result.canI to YES");
            $scope.canI = 'Yes.';
        }

        formatWeatherData();
    }

    function formatWeatherData() {
        console.log("* * * Entered formatWeatherData function * * *");
        console.log("Relevant Weather Data: ");
        console.log($scope.relevantWeatherData);

        console.log("Current 'No' triggers: " + $scope.triggers);

        $scope.relevantWeatherData.forEach(element => {
            //Instantiate an empty object to push data into
            let weatherEntry = {};

            //Get the date/time from the forecast element
            tempTimeObject = new Date(0);
            tempTimeObject.setUTCSeconds(element.time); 

            let hours = tempTimeObject.getHours();
            let ampm = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12;
            hours = hours ? hours : 12;
            
            let date = tempTimeObject.getDate();
            let month = tempTimeObject.getMonth();

            weatherEntry.epochTime = element.time;
            weatherEntry.time = hours + ' ' + ampm;
            weatherEntry.date = month + " " + date;
            weatherEntry.todtom = date > new Date().getDate() ? 'Tomorrow' : 'Today';

            //Get weather data
            weatherEntry.summary = element.summary;
            weatherEntry.temperature = element.temperature;
            weatherEntry.precipProb = (element.precipProbability * 100).toFixed(0); 
            weatherEntry.windSpeed = element.windSpeed;
            weatherEntry.humidity = (element.humidity * 100).toFixed(0);
            weatherEntry.icon = element.icon; 

            //Push triggers if there are any
            weatherEntry.triggers = [];

            //For each 'trigger' in $scope.triggers array...
            $scope.triggers.forEach(element => {
                if (element.time == weatherEntry.epochTime) {
                    weatherEntry.triggers.push(element.reason);
                }
            });

            //Push this entry into the displayedWeatherData array
            $scope.displayedWeatherData.push(weatherEntry);
        });

        console.log("Displayed Weather Data: ");
        console.log($scope.displayedWeatherData);

    }

    $scope.displaySettings = function() {
        
        $(".popup").css({'opacity': '1', 'visibility': 'visible'});
        $(".popup__content").css({'opacity': '1', 'transform': 'translate(-50%, -50%) scale(1)'});
    };

    $scope.hideSettings = function() {
        $(".popup").css({'opacity': '0', 'visibility': 'hidden'});
        $(".popup__content").css({'opacity': '0', 'transform': 'translate(-50%, -50%) scale(0)'});

        clearWeatherData();
        $scope.checkCanI();
    }

    $scope.resetDefaults = function() {
        console.log("Setting thresholds and times back to default values.");
        $scope.$storage.selectedActivity = "bike";
        $scope.$storage.selectedTime = "towork";
    
        $scope.$storage.storedLat = '';
        $scope.$storage.storedLong = '';
    
        $scope.$storage.thresholds = {
            bike: {
                highTemp: 85,
                lowTemp: 45,
                precipProb: 20,
                windSpeed: 15,
                humidity: 60
            },
            run: {
                highTemp: 80,
                lowTemp: 40,
                precipProb: 30,
                windSpeed: 10,
                humidity: 50
            },
            walk: {
                highTemp: 90,
                lowTemp: 55,
                precipProb: 30,
                windSpeed: 10,
                humidity: 70
            }
        };
    
        $scope.$storage.times = {
            towork: {
                start: 8,
                end: 17,
                type: 'commute'
            },
            toschool: {
                start: 7,
                end: 15,
                type: 'commute'
            },
            today: {
                start: 8,
                end: 19,
                type: 'block'
            },
            thismorning: {
                start: 7,
                end: 12,
                type: 'block'
            },
            thisafternoon: {
                start: 12,
                end: 18,
                type: 'block'
            },
            thisevening: {
                start: 18,
                end: 22,
                type: 'block'
            }
        }
    }
});


