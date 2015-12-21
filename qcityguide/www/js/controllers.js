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


.controller('AppCtrl', function ($scope, Data, $timeout, Products, Carts) {
    $scope.cates = Data.categories();
    // if(catRef) {
    //     $scope.loading = true;
    //     catRef.$loaded().then(function(csnap) {
    //         $scope.loading = false;
    //     })
    // }

    $scope.goBack = function () {
        window.history.back();
    };
})

.controller('ProductMenuCtrl', function ( $scope, $ionicModal, $timeout, $state, $ionicFilterBar, $stateParams, Data, Products) {
    $scope.title = $stateParams.cateTitle;       
    $scope.categoryid = $stateParams.cateId;
    var getItems = function() {
        var allshops = Data.shops();
        $scope.items = allshops[$stateParams.cateId];
        // for (var sk in allshops[$stateParams.cateId]) {
        //     var item = allshops[$stateParams.cateId][sk];
        //     item.key = sk;
        //     console.log("item", item);
        //     $scope.items.push(item);
        // }
    }
    getItems();
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
        $state.go('app.nearbydirection', {id:$scope.categoryid, shopid: shopid});
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

.controller('NearbyCtrl', function($scope, $stateParams, $window, $timeout, $rootScope, $ionicLoading, $ionicPopup, Data, $cordovaGeolocation) {
    shopRef = Data.shops();
    $scope.getmap = function() {
        if($stateParams.shopid) {
            $scope.title = "Get Direction";
            var posOptions = {timeout: 10000, enableHighAccuracy: true};
            $ionicLoading.show({template: 'Getting current Location.. Please wait..'});
            $cordovaGeolocation
            .getCurrentPosition(posOptions)
            .then(function (position) {
                var allShops = shopRef[$stateParams.id]; 
                var shop = allShops[$stateParams.shopid];
                //create route
                var rendererOptions = {
                    map: $scope.map,
                    suppressMarkers : true
                };
                directionsDisplay = new google.maps.DirectionsRenderer(rendererOptions);
                var org = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
                //var org = new google.maps.LatLng(25.427152, 51.486740);
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
                          icon: "img/"+$stateParams.id+".png"
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
        } else {
            var allShops = shopRef[$stateParams.id]; 
            console.log("allshops", allShops);
            $scope.title = "Nearby Shops";
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
            var markers = [];
            var infowindows = [];
            var i = 0;
            for(var k in allShops) {
                console.log("item", allShops[k]);
                infowindows[i] = new google.maps.InfoWindow({
                    content: allShops[k].title
                });
                markers[i] = new google.maps.Marker({
                icon: "img/"+$stateParams.id+".png",
                position: new google.maps.LatLng(allShops[k].lat, allShops[k].lng),
                optimized: true,
                map: $scope.map
              });
                markers[i].index = i;
                console.log("markers", markers);
                google.maps.event.addListener(markers[i], 'click', function() {
                        console.log(this.index); // this will give correct index
                        console.log(i); //this will always give 10 for you
                        infowindows[this.index].open($scope.map,markers[this.index]);
                        $scope.map.panTo(markers[this.index].getPosition());
                }); 
                i++;
            }
        }
        localStorage.setItem('reloadmap', false);
    }
    $scope.mapCreated = function(map) {
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
});
