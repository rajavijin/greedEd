// Ionic Starter App
var categories = null;
var shops = null;
var places = {};
var posOptions = {timeout: 10000, enableHighAccuracy: false};
// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.controllers' is found in controllers.js
angular.module('starter', ['ionic', 'starter.controllers', 'starter.services', 'jett.ionic.filter.bar', 'ngCordova'])

.constant('ApiEndpoint', {
  //url: 'http://www.qcityguide.com/home'
  url: 'http://192.168.1.5:8100/api'
})

.config(function($ionicConfigProvider) {
  $ionicConfigProvider.scrolling.jsScrolling(true);
})

.run(function($ionicPlatform, Data, $rootScope, $cordovaGeolocation) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if (window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
      cordova.plugins.Keyboard.disableScroll(true);

    }
    if (window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleDefault();
    }

    //I am getting and storing all data here mainly to store 
    //Create the categories
    // $rootScope.categories = [
    //   {name:"Food", key:"food", text: "Find the best place to eat", img:"img/restauraunts.jpg"},
    //   {name:"Hotels", key:"hotel", text: "Find the best place to stay", img:"img/hotels.jpg"},
    // ];

    //Create places by calling google places API
    // $rootScope.places = {};
    // var getPlaces = function(iteration) {
    //   var item = $rootScope.categories[iteration];
    //   if(item) {
    //     Data.getPlaces(item.key).then(function(placesData) {
    //       $rootScope.places[item.key] = placesData;
    //       getPlaces(iteration++);
    //     })
    //   }
    // }

    //Get current Location and assign in a scope.
    $cordovaGeolocation
    .getCurrentPosition(posOptions)
    .then(function (pos) {
      console.log("current pos", pos);
      $rootScope.currentP = [pos.coords.latitude, pos.coords.longitude];
    }, function(err) {
      // error
    });

  });
})
.directive('map', function($rootScope, $cordovaGeolocation, $ionicPopup) {
  return {
    restrict: 'E',
    scope: {
      onCreate: '&'
    },
    link: function ($scope, $element, $attr) {
      function initialize() {
        var mapOptions = {
          center: new google.maps.LatLng($rootScope.currentP[0], $rootScope.currentP[1]),
          zoom: 15,
          mapTypeId: google.maps.MapTypeId.ROADMAP,
          mapTypeControlOptions: {
            style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
            position: google.maps.ControlPosition.TOP_LEFT
          },
          zoomControl: true,
          zoomControlOptions: {
              position: google.maps.ControlPosition.TOP_RIGHT
          },
          streetViewControl: false,
        };
        var map = new google.maps.Map($element[0], mapOptions);
  
        $scope.onCreate({map: map});
        google.maps.event.addDomListener($element[0], 'mousedown', function (e) {
          e.preventDefault();
          return false;
        });
      }
      if (document.readyState === "complete") {
        initialize();
      } else {
        google.maps.event.addDomListener(window, 'load', initialize);
      }
    }
  }
})
.config(function($stateProvider, $urlRouterProvider) {
  $stateProvider
  .state('intro', {
    url: "/intro",
    templateUrl: "templates/intro.html",
    controller: 'IntroCtrl'
  })
  .state('app', {
    url: '/app',
    abstract: true,
    templateUrl: 'templates/menu.html',
    controller: 'AppCtrl'
  })
  .state('app.category', {
    url: "/category",
    views: {
        'menuContent': {
            templateUrl: "templates/category.html",
            controller: 'CategoriesCtrl'
        }
    }
  })
  .state('app.shops', {
    url: "/shops/:key/:name",
    views: {
        'menuContent': {
            templateUrl: "templates/shops.html",
            controller: 'ShopsCtrl'
        }
    }
  })
  .state('app.nearby', {
    url: "/nearby/:type",
    views: {
        'menuContent': {
            templateUrl: "templates/nearby.html",
            controller: 'NearbyCtrl'
        }
    }
  })
  .state('app.directions', {
    url: "/directions",
    views: {
        'menuContent': {
            templateUrl: "templates/directions.html",
            controller: 'DirectionsCtrl'
        }
    }
  })
  .state('app.profile', {
    url: "/profile",
    views: {
        'menuContent': {
            templateUrl: "templates/profile.html"
        }
    }
  });
  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/intro');
});
