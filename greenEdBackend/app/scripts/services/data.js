'use strict';

/**
 * @ngdoc service
 * @name greenEdApp.Data
 * @description
 * # Data
 * Service in the greenEdApp.
 */
angular.module('greenEdApp')
  .service('Data', function (FBURL, $window) {
    // AngularJS will instantiate a singleton by calling "new" on this function
    var Data = {
    	getMenus: function(role) {
    		if(role == "admin") {
		        return [{
		          'title': 'Dashboard',
		          'link': '/dashboard',
		          'class': 'icon-dashboard',
		        },{
		          'title': 'Add school',
		          'link': '/addschool',
		          'class': 'icon-home'
		        }];
			} else if (role == "hm") {
				return [{
				  'title': 'Dashboard',
				  'link': '/dashboard',
				  'class': 'icon-dashboard',
				},
				{
				  'title': 'Add Teacher',
				  'link': '/addteacher',
				  'class': 'icon-user-md'
				},
				{
				  'title': 'Add Class',
				  'link': '/addclass',
				  'class': 'icon-home'
				},
				{
				  'title': 'Add Student',
				  'link': '/addstudent',
				  'class': 'icon-user'
				},
				 {
				  'title': 'Teachers',
				  'link': '/teachers',
				  'class': 'icon-user-md'
				},
				{
				  'title': 'Class',
				  'link': '/class',
				  'class': 'icon-home'
				},
				{
				  'title': 'Student',
				  'link': '/student',
				  'class': 'icon-user'
				}];
			} else {
				return [];
			}
    	}
    };
    return Data;
  });
