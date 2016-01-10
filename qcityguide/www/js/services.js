var app = angular.module('starter.services', [])

app.factory('Data', function($rootScope, $q, $http, ApiEndpoint) {
  // Might use a resource here that returns a JSON array
  // $rootScope.cates = $firebaseObject(ref.child('shops'));
  // $rootScope.cates.$loaded().then(function(ccsnap) {
  // 	console.log("ccsnap", catRef)
  // });
  var dbCategories = [{
      "img" : "img/category/automotive.png",
      "name" : "Automotive",
      "text" : "The automotive industry.",
      "orderid": 1,
      "id": "automotive"
    },
    {
      "img" : "img/category/restaurants.png",
      "name" : "Restaurants",
      "text" : "Find the best restaurants",
      "id" : "restaurants"
    }];
  var dbShops = {
    "automotive" : [{
        "lat" : 25.2781746,
        "lng" : 51.4377515,
        "status" : "Closed",
        "title" : "ALMANA BUSN CENT",
        "type" : ["Automotive", "Car Rental", "Motorc"]
    }],
    "restaurants" : [{
        "lat" : 25.2968544,
        "lng" : 51.4815903,
        "status" : "Closed",
        "title" : "AFGHAN BROTHERS",
        "type" : ["Restaurants"]
    },
    {
        "lat" : 25.2630162,
        "lng" : 51.528807,
        "status" : "Closed",
        "title" : "AFGHAN BROTHERS",
        "type" : ["American","British"]
    }]
};

  return {
  	categories: function() {
	var q = $q.defer();

    $http.get(ApiEndpoint.url+'/all_category_for_mobile')
	    .success(function(data) {
	      console.log('Got some data: ', data)
	      categories = data;
	      q.resolve(data);
	    })
	    .error(function(error){
	      console.log('Had an error')
	      q.reject(error);
	    });

	 return q.promise;
  	},
  	shops: function() {
		var q = $q.defer();

	    $http.get(ApiEndpoint.url+'/all_shop_for_mobile')
		    .success(function(data) {
		      console.log('Got some data: ', data);
		      shops = data;
		      q.resolve(data);
		    })
		    .error(function(error){
		      console.log('Had an error')
		      q.reject(error);
		    });
		    
		 return q.promise;
  	},
    all: function() {
      return cates;
    },
    get: function(cateId) {
      for (var i = 0; i < cates.length; i++) {
        if (cates[i].id === parseInt(cateId)) {
          return cates[i];
        }
      }
      return null;
    }
  };
});