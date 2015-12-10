angular.module('hoss_app.controllers', [])


    .controller('IntroCtrl', function ($scope) {

    })
   

    .controller('AppCtrl', function ($scope, Cates, Products, Carts) {
        $scope.cates = Cates.all();
        $scope.productData = {};

        $scope.carts = Carts.all();

        $scope.goBack = function () {
            window.history.back();
        };
    })

    .controller('ProductMenuCtrl', function ( $scope, $ionicModal, $timeout, $state, $stateParams, Cates, Products) {
        $scope.cate = Cates.get($stateParams.cateId);      
        $scope.products = Products.all();

        $scope.productByCate = Products.getByCate($stateParams.cateId);

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

        $scope.goBack = function () {
            window.history.back();
        };

    })

