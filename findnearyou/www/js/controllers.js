angular.module('starter.controllers', [])


.controller('IntroCtrl', function ($scope, $timeout, $state, $ionicSlideBoxDelegate) {
    $scope.disableSwipe = function() {
       $ionicSlideBoxDelegate.enableSlide(false);
    };
    $scope.start = function() {
        $scope.loading = true;
        $timeout(function() {
            $scope.loading = false;
            $state.go('app.category', {});
        }, 2000);
    }
})

.controller('AppCtrl', function () {

})
.controller('CategoriesCtrl', function ($scope, Data, $ionicFilterBar, $timeout) {
    var filterBarInstance;
    $scope.getItems = function(refresh) {
        $scope.items = Data.categories();
        console.log("categories", Data.categories());
    }
    $scope.showFilterBar = function () {
        filterBarInstance = $ionicFilterBar.show({
          items: $scope.items,
          update: function (filteredItems, filterText) {
            $scope.items = filteredItems;
          }
        });
    };

    $scope.refreshItems = function () {
        if (filterBarInstance) {
          filterBarInstance();
          filterBarInstance = null;
        }

        $timeout(function () {
          getItems();
          $scope.$broadcast('scroll.refreshComplete');
        }, 1000);
    };
})

.controller('ShopsCtrl', function ( $scope, $rootScope, $cordovaGeolocation, $ionicModal, $timeout, $state, $ionicFilterBar, $stateParams, Data) {
    function deg2rad(deg) {
      return deg * (Math.PI/180)
    }
    $scope.title = $stateParams.name;
    function getDistanceFromLatLonInKm(lat1,lon1,lat2,lon2) {
      var R = 6371; // Radius of the earth in km
      var dLat = deg2rad(lat2-lat1);  // deg2rad below
      var dLon = deg2rad(lon2-lon1); 
      var a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
        Math.sin(dLon/2) * Math.sin(dLon/2)
        ; 
      var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
      var d = R * c; // Distance in km
      return Math.round(d * 100) / 100;
    }
    var calculateDistance  = function(destLat, destLng) {
      if($rootScope.currentP) {
        return getDistanceFromLatLonInKm($rootScope.currentP[0], $rootScope.currentP[1], destLat, destLng);
      } else {
        $cordovaGeolocation
        .getCurrentPosition(posOptions)
        .then(function (pos) {
          $rootScope.currentP = [pos.coords.latitude, pos.coords.longitude];
          return getDistanceFromLatLonInKm($rootScope.currentP[0], $rootScope.currentP[1], destLat, destLng);
        }, function(err) {
          // error
        });
      }
    }
    var applyItems = function(allplaces) {
      $rootScope.places = [];
      for (var pi = 0; pi < allplaces.length; pi++) {
        console.log('place', allplaces[pi]);
        var item = {
          lat: allplaces[pi].geometry.location.lat,
          lng: allplaces[pi].geometry.location.lng,
          name: allplaces[pi].name,
          icon: allplaces[pi].icon,
          image: allplaces[pi].reference,
          address: allplaces[pi].vicinity
        }
        item.distance = calculateDistance(allplaces[pi].geometry.location.lat, allplaces[pi].geometry.location.lng);
        $rootScope.places.push(item);
      };
    }
    $scope.getItems = function(refresh) {
      Data.getPlaces($stateParams.key).then(function(places) {
        $scope.loading = false;
        $scope.$broadcast('scroll.refreshComplete');
        console.log('places', places);
        applyItems(places);
      });
    }

    var filterBarInstance;
    $scope.showFilterBar = function () {
        filterBarInstance = $ionicFilterBar.show({
          items: $rootScope.places,
          update: function (filteredItems, filterText) {
            $rootScope.places = filteredItems;
          }
        });
    };

    $scope.refreshItems = function () {
        if (filterBarInstance) {
          filterBarInstance();
          filterBarInstance = null;
        }

        $timeout(function () {
          getItems();
          $scope.$broadcast('scroll.refreshComplete');
        }, 1000);
    };

    $scope.getDirection = function(place) {
        $rootScope.currentPlace = place;
        $state.go('app.directions', {}, {reload:true});
    }

    $scope.gotoNearby = function() {
        $state.go('app.nearby', {name:$stateParams.name}, {reload:true});
    }
})

.controller('NearbyCtrl', function($scope, $stateParams, $window, $timeout, $rootScope, $ionicModal, $ionicLoading, $ionicPopup, Data, $cordovaGeolocation) {
    $ionicLoading.show({template:'Getting current Location... please wait...'});
    $scope.title = "NearBy "+ $stateParams.name;
    var createShopMarkers = function(mshop, si) {
        infowindows[si] = new google.maps.InfoWindow({
                content: mshop.name + '<div>'+mshop.address+'</div>'
            });
            markers[si] = new google.maps.Marker({
                icon: "img/building.png",
                position: new google.maps.LatLng(mshop.lat, mshop.lng),
                optimized: true,
                map: $scope.map
              });
            markers[si].index = si;
            google.maps.event.addListener(markers[si], 'click', function() {
                    infowindows[this.index].open($scope.map,markers[this.index]);
                    $scope.map.panTo(markers[this.index].getPosition());
            });
        return;
    }

        var markers = [];
        var infowindows = [];
        var types = ['All'];
    function clearMarkers(markers) {
      for (var cm = 0; cm < markers.length; cm++) {
        markers[cm].setMap(null);
      }
      return [];
    }
    var getShops = function() {
        var allShops = $rootScope.places; 
        if(markers.length > 0) clearMarkers(markers);
        var usermInfoWindow = new google.maps.InfoWindow({
                content: "You"
            });
        var userm = new google.maps.Marker({
            icon: "img/person.png",
            position: new google.maps.LatLng($rootScope.currentP[0], $rootScope.currentP[1]),
            optimized: true,
            map: $scope.map
        });
        userm.addListener('click', function() {
              usermInfoWindow.open($scope.map, userm);
            });
        var i = 0;
        for(var k in allShops) {
            // for (var t = 0; t < allShops[k].types.length; t++) {
            //     var ctype = allShops[k].types[t].replace(/[ "]/g, "");
            //     if(types.indexOf(ctype) == -1) types.push(ctype);
            //     if($scope.filters.types[$scope.filters.type] == ctype) {
            //     }
            // } 
            // if($scope.filters.type == 0) createShopMarkers(allShops[k], i);
          createShopMarkers(allShops[k], i);
          i++;
        }
    }
    $scope.mapCreated = function(map) {
        $ionicLoading.hide();
        $scope.map = map;
        getShops();
    };
})

.controller('DirectionsCtrl', function($scope, $stateParams, $window, $timeout, $interval, $rootScope, $ionicModal, $ionicLoading, $ionicPopup, Data, $cordovaGeolocation) {
    $scope.type = 'DRIVING';
    var startMarker = null;
    var startMarker = null;
    var myInterval = null;
    $scope.showDirection = false;
    $ionicLoading.show({template: 'Getting current Location....'});
    $scope.navigation = '';
  //create route
    var directionsService = new google.maps.DirectionsService;
    $scope.mapCreated = function(map) {
        $scope.map = map;
        var rendererOptions = {
          map: $scope.map,
          suppressMarkers : true
        };
        directionsDisplay = new google.maps.DirectionsRenderer(rendererOptions);
        myInterval = $interval(function() {
          console.log("interval working", $scope.type);
          $scope.getDirection($scope.type, true);
        }, 5000);
    };
    $scope.$on("$destroy", function (event) {
        if ( myInterval ) {
            $interval.cancel( myInterval );
        }
    });
    var calculateAndDisplayRoute = function() {
      var loc = {lat: parseInt($rootScope.currentPlace.lat), lng: parseInt($rootScope.currentPlace.lng)};
      directionsDisplay.setPanel(document.getElementById('directions'));
      directionsService.route({
        //origin: {lat: 25.285447, lng: 51.531040},
        origin: new google.maps.LatLng($rootScope.currentP[0], $rootScope.currentP[1]),
        destination: new google.maps.LatLng($rootScope.currentPlace.lat, $rootScope.currentPlace.lng),
        travelMode: google.maps.TravelMode[$scope.type]
      }, function(response, status) {
        if (status == google.maps.DirectionsStatus.OK) {
          var myRoute = response.routes[0].legs[0];
          $timeout(function() { $scope.title = myRoute.distance.text +', '+ myRoute.duration.text;}, 1000); 
          $scope.title = myRoute.distance.text +', '+ myRoute.duration.text; 
          var startInfo = new google.maps.InfoWindow({content: "You"});
          startMarker = new google.maps.Marker({
            position: myRoute.steps[0].start_point, 
            map: $scope.map,
            icon: "img/person.png"
          });
          startMarker.addListener('click', function() {
            startInfo.open($scope.map, startMarker);
          });
          var endInfo = new google.maps.InfoWindow({content: $rootScope.currentPlace.name + '<div>'+$rootScope.currentPlace.address+'</div>'});
          endMarker = new google.maps.Marker({
            position: myRoute.steps[myRoute.steps.length - 1].end_point, 
            map: $scope.map,
            icon: "img/building.png"
          });
          endMarker.addListener('click', function() {
            endInfo.open($scope.map, endMarker);
          });
          directionsDisplay.setDirections(response);
        } else {
          //directionsDisplay.setMap(null);
          //startMarker.setMap(null);
          //endMarker.setMap(null);
          $scope.type = $scope.oldType;
          $ionicPopup.alert({
            title: 'Route Error',
            content: 'We could not find route, due to '+status.replace(/_/g, ' ')
          }).then(function(res) {
            console.log('Test Alert Box');
          });
        }
      });
    }
    $scope.getDirection = function(type, update) {
      $scope.oldType = $scope.type;
      $scope.type = type;
      if(update) {
        $cordovaGeolocation
        .getCurrentPosition(posOptions)
        .then(function (pos) {
            //$rootScope.currentP = [pos.coords.latitude, pos.coords.longitude];
            console.log("currentP", $rootScope.currentP);
            $ionicLoading.hide();
            calculateAndDisplayRoute();
        }, function(err) {
            $ionicPopup.alert({
              title: 'Location Settings Error',
              content: 'Please enable location settings. Go to -> Settings -> Location and turn on.'
            }).then(function(res) {
              console.log('Test Alert Box');
            });
        });
      } else {
        $scope.showDirection = false;
        calculateAndDisplayRoute();
      }
    }
    
    $scope.getmap = function() {
        if($stateParams.shopid) getDirection();
        else getShops();
        localStorage.setItem('reloadmap', false);
    }
    $scope.reload = function() {
        localStorage.setItem('reloadmap', true);
        $window.location.reload(true);
    }
    $scope.getRouteDetails = function() {
      if(!$scope.showDirection) {
        var x = document.getElementById("directions");
        $scope.navigation = x.innerHTML;
        console.log("nav", $scope.navigation);
      }
      $scope.openModal();
      //$scope.showDirection = !$scope.showDirection;
    };

  $ionicModal.fromTemplateUrl('templates/direction-details.html', {
    scope: $scope,
    animation: 'slide-in-up'
  }).then(function(modal) {
    $scope.modal = modal;
  });
  $scope.openModal = function() {$scope.modal.show();};
  $scope.closeModal = function() {$scope.modal.hide();};
  $scope.dashboardFilters = function() {
    getShops();
    $scope.closeModal();
  }
})
