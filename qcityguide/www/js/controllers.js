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


.controller('AppCtrl', function ($scope, $rootScope, Data, $timeout) {
    $scope.loading = true;
    var serverData = function() {
      Data.categories().then(function(dbcategories) {
        $rootScope.categories = dbcategories;
        $scope.loading = false;
      })
    }
    $scope.getItems = function(refresh) {
        if(refresh) { serverData(); $scope.$broadcast('scroll.refreshComplete'); }
        else { $scope.loading = false; if(!$rootScope.categories) serverData(); }
    }

    $scope.goBack = function () {
        window.history.back();
    };
})

.controller('ProductMenuCtrl', function ( $scope, $ionicModal, $timeout, $state, $ionicFilterBar, $stateParams, Data) {
    $scope.title = $stateParams.cateTitle;       
    $scope.categoryid = $stateParams.cateId;
    $scope.catIndex = $stateParams.catIndex;
    var serverData = function() {
        Data.shops().then(function(dbshops) {
            $scope.items = shops[$stateParams.cateId];
            shops = dbshops;
        });
    }
    $scope.getItems = function(refresh) {
        if(refresh) { serverData(); $scope.$broadcast('scroll.refreshComplete'); }
        else { $scope.items = (shops) ? shops[$stateParams.cateId] : serverData(); }
    }

    var filterBarInstance;
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

    $ionicModal.fromTemplateUrl('templates/product_detail.html', {
        scope: $scope
    }).then(function (modal) {
        $scope.modal = modal;
    });
    // Triggered in the product modal to close it
    $scope.closeModal = function () {
        $scope.modal.hide();
    };
    $scope.getdirection = function(shopid) {
        $scope.modal.hide();
        $state.go('app.nearbydirection', {id:$scope.categoryid, shopid: $scope.shopid});
    }

    // Open the product modal
    $scope.productDetail = function (id) {
        console.log("id", id);
        $scope.shopid = id;
        $scope.modal.show();
    };
    $scope.gotoNearby = function() {
        $state.go('app.nearby', {id:$stateParams.cateId}, {reload:true});
    }
    $scope.goBack = function () {
        window.history.back();
    };

})

.controller('NearbyCtrl', function($scope, $stateParams, $window, $timeout, $rootScope, $ionicModal, $ionicLoading, $ionicPopup, Data, $cordovaGeolocation) {
    if(!shops) {
        Data.shops().then(function(dbshops) {
            console.log("server", shops);
            shops = dbshops;
        });
    }
    $ionicLoading.show({template:'Loading map... please wait...'});
    $scope.title = ($stateParams.shopid) ? "Get Direction" : "Nearby Shops";
    $scope.filters = {types:[], type: 0};
    var getDirection = function() {
        var posOptions = {timeout: 10000, enableHighAccuracy: true};
        $ionicLoading.show({template: 'Getting current Location.. Please wait..'});
        $cordovaGeolocation
        .getCurrentPosition(posOptions)
        .then(function (position) {
            var allShops = shops[$stateParams.id]; 
            var shop = allShops[$stateParams.shopid];
            //create route
            var rendererOptions = {
                map: $scope.map,
                suppressMarkers : true
            };
            directionsDisplay = new google.maps.DirectionsRenderer(rendererOptions);
            //var org = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
            var org = new google.maps.LatLng(25.427152, 51.486740);
            var dest = new google.maps.LatLng(shop.lat, shop.lng);
            var request = {
                origin: org,
                destination: dest,
                travelMode: google.maps.DirectionsTravelMode.DRIVING
            };
            directionsService = new google.maps.DirectionsService();
            directionsService.route(request, function(response, status) {
                console.log("Route status", status);
                if (status == google.maps.DirectionsStatus.OK) {
                    var myRoute = response.routes[0].legs[0];
                    var startInfo = new google.maps.InfoWindow({content: "You"});
                    var startMarker = new google.maps.Marker({
                      position: myRoute.steps[0].start_point, 
                      map: $scope.map,
                      icon: "img/person.png"
                    });
                    startMarker.addListener('click', function() {
                      startInfo.open($scope.map, startMarker);
                    });
                    var endInfo = new google.maps.InfoWindow({content: shop.title});
                    var endMarker = new google.maps.Marker({
                      position: myRoute.steps[myRoute.steps.length - 1].end_point, 
                      map: $scope.map,
                      icon: "img/"+$stateParams.id.toLowerCase()+".png"
                    });
                    endMarker.addListener('click', function() {
                      endInfo.open($scope.map, endMarker);
                    });
                    directionsDisplay.setDirections(response);
                    directionsDisplay.setMap($scope.map);
                } else {
                    alert('failed to get directions');
                }
            });
            $ionicLoading.hide();
        }, function(err) {
            $ionicLoading.hide();
            $ionicPopup.alert({
              title: 'Location Settings Error',
              content: 'Please enable location settings. Go to -> Settings -> Location and turn on.'
            }).then(function(res) {
              console.log('Test Alert Box');
            });
            console.log("no geo location found", JSON.stringify(err));
        });
    }
    var createShopMarkers = function(mshop, si) {
        infowindows[si] = new google.maps.InfoWindow({
                content: mshop.title + '<div>'+mshop.types.toString()+'</div>'
            });
            markers[si] = new google.maps.Marker({
                icon: "img/"+$stateParams.id.toLowerCase()+".png",
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
        var allShops = shops[$stateParams.id]; 
        console.log("allshops", allShops);
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
            for (var t = 0; t < allShops[k].types.length; t++) {
                var ctype = allShops[k].types[t].replace(/[ "]/g, "");
                if(types.indexOf(ctype) == -1) types.push(ctype);
                console.log("filter val", $scope.filters.type);
                console.log("item", ctype);
                if($scope.filters.types[$scope.filters.type] == ctype) {
                    console.log("filtered markers", allShops[k]);
                    createShopMarkers(allShops[k], i);
                }
            } 
            if($scope.filters.type == 0) createShopMarkers(allShops[k], i);
            i++;
        }
        $scope.filters.types = types;
        console.log("types", types);
    }
    $scope.getmap = function() {
        if($stateParams.shopid) getDirection();
        else getShops();
        localStorage.setItem('reloadmap', false);
    }
    $scope.mapCreated = function(map) {
        $ionicLoading.hide();
        $scope.map = map;
        if(localStorage.getItem('reloadmap')) {
            $scope.getmap();
        } else {
            $scope.getmap();   
        }
    };
    $scope.reload = function() {
        localStorage.setItem('reloadmap', true);
        $window.location.reload(true);
    }

  $ionicModal.fromTemplateUrl('templates/shopFilters.html', {
    scope: $scope,
    animation: 'slide-in-up'
  }).then(function(modal) {
    $scope.modal = modal;
  });
  $scope.openModal = function() {$scope.modal.show();};
  $scope.closeModal = function() {$scope.modal.hide();};
  $scope.filterData = function() {$scope.openModal();}
  $scope.dashboardFilters = function() {
    getShops();
    $scope.closeModal();
  }
});
