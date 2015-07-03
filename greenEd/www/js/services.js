angular.module('starter.services', [])
.factory('MyService', function($rootScope, $ionicLoading, $ionicPopup, $state, $http, $q, myConfig) {
  console.log("base in service", myConfig.base);
  var baseUrl = myConfig.base+':8100/api';
  var loginEndpoint       = baseUrl +'/users/verify';
  var logoutEndpoint       = baseUrl +'/users/';
  var token = localStorage.getItem('token') || '';
  if(token) {
    $http.defaults.headers.common.Authorization = "Bearer "+token;
  }
  
  var service = {
    login: function(userData) {
      var defer = $q.defer();
      $http
      .post(loginEndpoint, userData)
      .success(function (data, status, headers, config) {
        console.log("status:", status);
        if(data.status == "password not matching") {
          $ionicLoading.hide();
          $ionicPopup.alert({
              title: 'Login failed!',
              template: 'Password not matching'
          });
        } else {
          $http.defaults.headers.common.Authorization = "Bearer "+data.token;
          user = data;
          localStorage.setItem('token', data.token);
          delete data.token;
          localStorage.setItem('uid', data._id);
          localStorage.setItem('user', JSON.stringify(data));
          console.log("CURRENT LOGGED IN USER:", data);
          /*$ionicUser.identify({user_id: data._id, name: data.name, message: data.role +' of '+data.school}).then(function(identity) {
            console.log("user identified in ionic", identity);
          }, function(err) {
           console.log("user identification failed", err);
          });*/
          defer.resolve(data);
        }
      })
      .error(function (data, status, headers, config) {
        defer.reject(status);
        console.log("status", status);
        var alertPopup = $ionicPopup.alert({
          title: 'Login failed!',
          template: 'Please check your credentials!'
        });
      });
        return defer.promise;
    },
    logout: function(user) {
      var defer = $q.defer();
      $http.post(logoutEndpoint, {})
      .success(function(data, status, headers, config) {
        delete $http.defaults.headers.common.Authorization;
        defer.resolve(data);
      })
      .error(function(data, status, headers, config) {
        defer.reject(data);
      });
      return defer.promise;     
    },
    getTimetable: function(params) {
      console.log("Timetable Params:", params);
      var defer = $q.defer();
      $http.get(baseUrl+'/timetable/'+params.schoolid+'/'+params.class+'/'+params.subject)
      .success(function(data, status, headers, config){
        defer.resolve(data);
      }).error(function(data, status, headers, config){
        defer.reject(data);
      }); 
      return defer.promise;
    },
    getMessages: function(params) {
      console.log("Get messages Params:", params);
      var defer = $q.defer();
      if(!params.classes) params.classes = "undefined";
      $http.get(baseUrl+'/messages/'+params.schoolid+'/'+params.userId+'/'+params.classes)
      .success(function(data, status, headers, config){
        defer.resolve(data);
      }).error(function(data, status, headers, config){
        defer.reject(data);
      }); 
      return defer.promise;
    },
    getConversation: function(params) {
      console.log("Get messages Params:", params);
      var defer = $q.defer();
      $http.get(baseUrl+'/messages/'+params.schoolid+'/'+params.chatname)
      .success(function(data, status, headers, config){
        defer.resolve(data);
      }).error(function(data, status, headers, config){
        defer.reject(data);
      }); 
      return defer.promise;
    },
    sendMessage: function(message) {
      console.log("Message", message);
      var defer = $q.defer();
      $http.post(baseUrl+'/messages', message)
      .success(function(data, status, headers, config){
        defer.resolve(data);
      }).error(function(data, status, headers, config){
        defer.reject(data);
      }); 
      return defer.promise;
    },
    updateMessages: function(message) {
      console.log("Message", message);
      var defer = $q.defer();
      $http.post(baseUrl+'/messages/update', message)
      .success(function(data, status, headers, config){
        defer.resolve(data);
      }).error(function(data, status, headers, config){
        defer.reject(data);
      }); 
      return defer.promise;
    },
    updateMarks: function(marks) {
      console.log("update marks:", marks);
      var defer = $q.defer();
      $http.post(baseUrl+'/marks/'+marks._id, marks)
      .success(function(data, status, headers, config){
        defer.resolve(data);
      }).error(function(data, status, headers, config){
        defer.reject(data);
      }); 
      return defer.promise;
    },    
    getMarks: function(student) {
      var defer = $q.defer();
      var type = student.typeofexam;
      if(student.typeofexam % 1 === 0) {
        type = (student.typeofexams) ? student.typeofexams[student.typeofexam]: 'all';
      }
      console.log("user typeofexams", user.typeofexams);
      console.log('Mark url: ', '/marks/'+student.schoolid+'/'+student.year+'/'+type+'/'+student.studentid+'/'+student.standard+'/'+student.division);
      $http.get(baseUrl+'/marks/'+student.schoolid+'/'+student.year+'/'+type+'/'+student.studentid+'/'+student.standard+'/'+student.division)
      .success(function(data, status, headers, config){
        defer.resolve(data);
      }).error(function(data, status, headers, config){
        defer.reject(data);
      }); 
      return defer.promise;
    },
    listUsers: function(params) {
      console.log("list Params", params);
      var defer = $q.defer();
      if(!params.grade) params.grade = "all"; 
      $http.get(baseUrl+'/marks/'+params.schoolid+'/'+params.year+'/'+params.typeofexam+'/'+params.standard+'/'+params.division+'/'+params.status+'/'+params.subject+'/'+params.mark+'/'+params.grade)
      .success(function(data, status, headers, config){
        defer.resolve(data);
      }).error(function(data, status, headers, config){
        defer.reject(data);
      }); 
      return defer.promise;
    },
    getUsers: function(userdata) {
      var defer = $q.defer();
      if(!userdata.role) userdata.role = 'student';
      if(userdata.role == "hm") userdata.role = "all";
      console.log("url", '/users/'+userdata.schoolid+'/'+userdata.standard+'/'+userdata.division+'/'+userdata.sex+'/'+userdata.status+'/'+userdata._id+'/'+userdata.role+'/'+userdata.name);
      $http.get(baseUrl+'/users/'+userdata.schoolid+'/'+userdata.standard+'/'+userdata.division+'/'+userdata.sex+'/'+userdata.status+'/'+userdata._id+'/'+userdata.role+'/'+userdata.name)
      .success(function(data, status, headers, config){
        defer.resolve(data);
      }).error(function(data, status, headers, config){
        defer.reject(data);
      }); 
      return defer.promise;
    },
    getProfile: function(userdata) {
      var defer = $q.defer();
      $http.get(baseUrl+'/users/'+userdata._id)
      .success(function(data, status, headers, config){
        defer.resolve(data);
      }).error(function(data, status, headers, config){
        defer.reject(data);
      }); 
      return defer.promise;
    },
    createWall: function(wall) {
      console.log("Wall data:", JSON.stringify(wall));
      var defer = $q.defer();
      $http.post(baseUrl+'/wall', wall)
      .success(function(data, status, headers, config){
        defer.resolve(data);
      }).error(function(data, status, headers, config){
        defer.reject(data);
      }); 
      return defer.promise;
    },
    getWall: function(wall) {
      console.log("Wall data:", wall);
      var defer = $q.defer();
      $http.get(baseUrl+'/wall/'+wall.schoolid+'/'+wall.to)
      .success(function(data, status, headers, config){
        defer.resolve(data);
      }).error(function(data, status, headers, config){
        defer.reject(data);
      }); 
      return defer.promise;
    },
    updateWall: function(wall) {
      console.log("Wall update data:", wall);
      var defer = $q.defer();
      $http.post(baseUrl+'/wall/'+wall._id, wall)
      .success(function(data, status, headers, config){
        defer.resolve(data);
      }).error(function(data, status, headers, config){
        defer.reject(data);
      }); 
      return defer.promise;
    },
    getMenus: function() {
      var menus = {
        "hmMenu": {"Links":[{"title":"Dashboard", "href":"/app/hmdashboard", "class":"ion-stats-bars"}, {"title":"Classes", "href":"/app/allclasses", "class": "ion-easel"}, {"title":"Students", "href":"/app/allstudents", "class": "ion-person-stalker"},{"title":"Teachers", "href":"/app/allteachers", "class": "ion-ios-body"},{"title":"Wall","href":"/app/wall","class":"ion-ios-list"},{"title":"Messages", "href":"/app/messages", "class":"ion-chatboxes"},{"title":"log-out", "href":"logout", "class":"ion-log-out"}]},
        //"parentMenu": {"Links":[{"title":"Children", "href":"/app/allstudents", "class": "ion-person-stalker"},{"title":"Wall","href":"/app/wall","class":"ion-ios-list"},{"title":"log-out", "href":"logout", "class":"ion-log-out"}]},
        "parentSingleMenu": {"Links":[{"title":"Dashboard", "href":"/app/studentdashboard", "class":"ion-stats-bars"},{"title":"Overall Dashboard", "href":"/app/studentoveralldashboard", "class":"ion-ios-pulse-strong"},{"title":"Class Dashboard", "href":"/app/dashboard", "class":"ion-pie-graph"},{"title":"Wall","href":"/app/wall","class":"ion-ios-list"},{"title":"Messages", "href":"/app/messages", "class":"ion-chatboxes"},{"title":"TimeTable", "href":"/app/timetable", "class":"ion-ios-time-outline"},{"title":"Profile", "href":"/app/studentprofile", "class": "ion-person"},{"title":"log-out", "href":"logout", "class":"ion-log-out"}]},
        "teacherMenu": {"Links":[{"title":"Dashboard", "href":"/app/teacherdashboard", "class":"ion-stats-bars"},{"title":"Students", "href":"/app/allstudents", "class": "ion-person-stalker"},{"title":"Profile", "href":"/app/teacherprofile", "class": "ion-person"},{"title":"Wall","href":"/app/wall","class":"ion-ios-list"},{"title":"Messages", "href":"/app/messages", "class":"ion-chatboxes"},{"title":"log-out", "href":"logout", "class":"ion-log-out"}]},
        "classTeacherMenu": {"Links":[{"title":"Class Dashboard", "href":"/app/dashboard", "class":"ion-stats-bars"},{"title":"Teacher Dashboard", "href":"/app/teacherdashboard", "class":"ion-ios-pulse-strong"},{"title":"Students", "href":"/app/allstudents", "class": "ion-person-stalker"},{"title":"Messages", "href":"/app/messages", "class":"ion-chatboxes"},{"title":"Class Profile", "href":"/app/classprofile", "class": "ion-easel"},{"title":"Profile", "href":"/app/teacherprofile", "class": "ion-person"},{"title":"Wall","href":"/app/wall","class":"ion-ios-list"},{"title":"log-out", "href":"logout", "class":"ion-log-out"}]},
      }
      if(user.role == "hm") {
        return menus.hmMenu;
      } else if (user.role == "parent") {
        if(user.students.length > 1) {
          $rootScope.role = "parent";
          var parentMenu = {"Links":[]};
          for (var i = 0; i < user.students.length; i++) {
            var sd = user.students[i].class.split("-");
            parentMenu.Links.push({title:user.students[i].name,href:"", class:"ion-android-person", header:"header", expand:true, index:i});
            parentMenu.Links.push({title:"Dashboard",href:"/app/studentdashboard/"+user.students[i].id+"/"+user.students[i].name,class:"ion-stats-bars ",header:"submenu", index:i});
            parentMenu.Links.push({title:"Overall Dashboard",href:"/app/studentoveralldashboard/"+user.students[i].id+"/"+user.students[i].name,class:"ion-ios-pulse-strong ",header:"submenu", index:i});
            parentMenu.Links.push({title:"Class Dashboard",href:"/app/dashboard/"+sd[0]+"/"+sd[1],class:"ion-pie-graph ",header:"submenu", index:i});
            parentMenu.Links.push({title:"Messages",href:"/app/messages/"+user.students[i].id,class:"ion-chatboxes ",header:"submenu", index:i});
            parentMenu.Links.push({title:"TimeTable",href:"/app/timetable/"+user.students[i].class+"/all",class:"ion-ios-time-outline ",header:"submenu", index:i});
            parentMenu.Links.push({title:"Profile",href:"/app/studentprofile/"+user.students[i].id,class: "ion-person ",header:"submenu", index:i});
          }
          parentMenu.Links.push({"title":"Wall","href":"/app/wall","class":"ion-ios-list"});
          parentMenu.Links.push({"title":"log-out", "href":"logout", "class":"ion-log-out"});
          return parentMenu;
        } else {
          $rootScope.role = "parentSingle";
          return menus.parentSingleMenu;
        }
      } else {
        if(user.standard) {
          $rootScope.role = "teacherClass";
          return menus.classTeacherMenu;
        } else {
          $rootScope.role = "teacher";
          return menus.teacherMenu;
        }
      }
    },          
    online: function() {
      return true;
      if(navigator.platform == "Linux x86_64") {
        return true;
      }

      var networkState = navigator.connection.type;
      var states = {};
      states[Connection.UNKNOWN] = 'Unknown connection';
      states[Connection.ETHERNET] = 'Ethernet connection';
      states[Connection.WIFI] = 'WiFi connection';
      states[Connection.CELL_2G] = 'Cell 2G connection';
      states[Connection.CELL_3G] = 'Cell 3G connection';
      states[Connection.CELL_4G] = 'Cell 4G connection';
      states[Connection.NONE] = 'No network connection';
      if (states[networkState] == 'No network connection') {
        return false;
      }
      else {
        return true;
      }
    }
  };
  return service;
})
angular.module('underscore', []).factory('_', function() {return window._;});