angular.module('starter.controllers', [])


    .controller('IntroCtrl', function ($scope) {

    })
   

    .controller('AppCtrl', function ($scope, Data, Products, Carts) {
        $scope.cates = catRef;
        $scope.productData = {};

        $scope.carts = Carts.all();

        $scope.goBack = function () {
            window.history.back();
        };
    })

    .controller('ProductMenuCtrl', function ( $scope, $ionicModal, $timeout, $state, $stateParams, Data, Products) {
        $scope.cate = catRef[$stateParams.cateId];      
        $scope.products = shopRef[$stateParams.cateId];

        $scope.productByCate = shopRef[$stateParams.cateId];

        $ionicModal.fromTemplateUrl('templates/app/product_detail.html', {
            scope: $scope
        }).then(function (modal) {
            $scope.modal = modal;
        });
        // Triggered in the product modal to close it
        $scope.closeModal = function () {
            $scope.modal.hide();
        };
        
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
        $scope.productDetail = function ($id) {
            $scope.product = Products.get($id);
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

      };

});
