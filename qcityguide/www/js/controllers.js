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
    $scope.cates = catRef;
    $scope.loading = true;
    catRef.$loaded().then(function(csnap) {
        $scope.loading = false;
    })

    $scope.goBack = function () {
        window.history.back();
    };
})

.controller('ProductMenuCtrl', function ( $scope, $ionicModal, $timeout, $state, $ionicFilterBar, $stateParams, Data, Products) {
    $scope.cate = (catRef) ? catRef[$stateParams.cateId] : '';       
    $scope.items = [];
    $scope.categoryid = $stateParams.cateId;
    var getItems = function() {
        if(shopRef) {
            for (var sk in shopRef[$stateParams.cateId]) {
                var item = shopRef[$stateParams.cateId][sk];
                item.key = sk;
                console.log("item", item);
                $scope.items.push(item);
            }
        }
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

    $ionicModal.fromTemplateUrl('templates/app/product_detail.html', {
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
    $scope.doOrder = function () {
        $state.go("app.shopping_cart");
        $timeout(function () {
            $scope.closeModal();
        }, 1000);
    };

    // Click like product
    $scope.doLike = function(){
        var btn_like = angular.element(document.querySelector('.product-like'));
        btn_like.find('i').toggleClass('active');
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

.controller('NearbyCtrl', function($scope, $stateParams, $ionicLoading) {
  $scope.mapCreated = function(map) {
    $scope.map = map;
    var allShops = shopRef[$stateParams.id]
    if($stateParams.shopid) {
        $scope.title = "Get Direction";
        console.log("allshops", allShops);
        console.log("shopid", $stateParams.shopid);
        var shop = allShops[$stateParams.shopid];
        console.log("shop", shop);
        navigator.geolocation.getCurrentPosition(function (pos) {
            console.log('Got pos', pos);
            //create route
            var rendererOptions = {
                map: map,
                suppressMarkers : true
            };
            directionsDisplay = new google.maps.DirectionsRenderer(rendererOptions);
            var org = new google.maps.LatLng(25.427152, 51.486740);
            var dest = new google.maps.LatLng(shop.lat, shop.lng);
            var request = {
                origin: org,
                destination: dest,
                travelMode: google.maps.DirectionsTravelMode.DRIVING
            };
            directionsService = new google.maps.DirectionsService();
            directionsService.route(request, function(response, status) {
                if (status == google.maps.DirectionsStatus.OK) {
                    var myRoute = response.routes[0].legs[0];
                    var startMarker = new google.maps.Marker({
                      position: myRoute.steps[0].start_point, 
                      map: map,
                      icon: "img/person.png"
                    });
                    var endMarker = new google.maps.Marker({
                      position: myRoute.steps[myRoute.steps.length - 1].end_point, 
                      map: map,
                      icon: "img/"+$stateParams.id+".png"
                    });
                    directionsDisplay.setDirections(response);
                    directionsDisplay.setMap(map);
                } else {
                    alert('failed to get directions');
                }
            });
        }, function (error) {
          alert('Unable to get location: ' + error.message);
        });
    } else {
        $scope.title = "Nearby Shops";
        for(var k in allShops) {
            console.log("item", allShops[k]);
            var marker = new google.maps.Marker({
            icon: "img/restaurant.png",
            //icon: "https://lh4.googleusercontent.com/-UjKiveTyTUI/VKJ3RyUC0LI/AAAAAAAAAGc/zxBS9koEx6c/w800-h800/nnkjn.png&chld=" + vehicle.vtype + "|bbT|" + vehicle.routeTag + "|" + vehicleColor + "|eee",
            position: new google.maps.LatLng(allShops[k].lat, allShops[k].lng),
            optimized: true,
            map: map
          });
        }
    }

  };

});
