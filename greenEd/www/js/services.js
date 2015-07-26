angular.module('starter.services', [])

.factory('myCache', function($cacheFactory) {
  return $cacheFactory('myCache');
})

.factory('Auth', function ( $firebaseAuth, $q, $firebaseObject, myCache, $firebaseArray, FIREBASE_URL, $state, $rootScope) {
  var ref = new Firebase(FIREBASE_URL);
  var auth = $firebaseAuth(ref);
  var menus = {
    "hmMenu": {"Links":[{"title":"Dashboard", "href":"/app/hmdashboard", "class":"ion-stats-bars"},{"title":"Classes", "href":"/app/allclasses", "class": "ion-easel"},{"title":"Students", "href":"/app/allstudents", "class": "ion-person-stalker"},{"title":"Teachers", "href":"/app/allteachers", "class": "ion-ios-body"},{"title":"Wall","href":"/app/wall","class":"ion-ios-list"},{"title":"Messages", "href":"/app/messages", "class":"ion-chatboxes"}]},
    //"parentMenu": {"Links":[{"title":"Children", "href":"/app/allstudents", "class": "ion-person-stalker"},{"title":"Wall","href":"/app/wall","class":"ion-ios-list"},{"title":"log-out", "href":"logout", "class":"ion-log-out"}]},
    "parentSingleMenu": {"Links":[{"title":"Dashboard", "href":"/app/studentdashboard", "class":"ion-stats-bars"},{"title":"Overall Dashboard", "href":"/app/studentoveralldashboard", "class":"ion-ios-pulse-strong"},{"title":"Class Dashboard", "href":"/app/dashboard", "class":"ion-pie-graph"},{"title":"Wall","href":"/app/wall","class":"ion-ios-list"},{"title":"Messages", "href":"/app/messages", "class":"ion-chatboxes"},{"title":"TimeTable", "href":"/app/timetable", "class":"ion-ios-time-outline"}]},
    "teacherMenu": {"Links":[{"title":"Dashboard", "href":"/app/teacherdashboard", "class":"ion-stats-bars"},{"title":"Students", "href":"/app/allstudents", "class": "ion-person-stalker"},{"title":"Wall","href":"/app/wall","class":"ion-ios-list"},{"title":"Messages", "href":"/app/messages", "class":"ion-chatboxes"}]},
    "classTeacherMenu": {"Links":[{"title":"Class Dashboard", "href":"/app/dashboard", "class":"ion-stats-bars"},{"title":"Teacher Dashboard", "href":"/app/teacherdashboard", "class":"ion-ios-pulse-strong"},{"title":"Students", "href":"/app/allstudents", "class": "ion-person-stalker"},{"title":"Messages", "href":"/app/messages", "class":"ion-chatboxes"},{"title":"Profile", "href":"/app/teacherprofile", "class": "ion-person"},{"title":"Wall","href":"/app/wall","class":"ion-ios-list"}]},
  }
  var Auth = {
    login: function (userdata) {
      var defer = $q.defer();
      ref.authWithPassword(userdata, function(err, userdatafb) {
        if(err) {
          defer.reject(err);
        } else {
          ref.child('users/'+userdatafb.uid).on('value', function(profilesnap) {
            user = profilesnap.val();
            user.uid = userdatafb.uid;
            var key = "usertype";
            var value = user.schoolid + '_student';
            if(user.role == 'teacher') {
              key = user.uid;
              for (var i = 0; i < user.subjects.length; i++) {
                value = (i == 0) ? user.subjects[i].subject : value+'_'+user.subject[i].subject;
              };
              value += "_"+user.name;
            } else if (user.role == 'parent') {
              key = 'parentkids';
              value += '_'+user.uid;
            }
            user.alluserskey = key;
            user.allusersval = value;
            console.log("Profile from FB:", user);
            localStorage.setItem("user", JSON.stringify(user));
            defer.resolve(user);
          });
        }
      });
      return defer.promise;
    },
    logout: function() {
      return ref.unauth();
    },
    filters: function(schoolid) {
      console.log("Filters key in service", schoolid);
      return $firebaseObject(ref.child(schoolid+"/filters"));
    },
    getUsers: function() {
      var deferred = $q.defer();
      var steacherindex = {};
      ref.child('users').orderByChild(user.alluserskey).equalTo(user.allusersval).once('value', function(usnap) {
        var allusers = {allclasses:[],classes:{},allstudents:[],students:{},allteachers:[], teachers:{}};
        usnap.forEach(function(fbusers) {
          var fbuser = fbusers.key();
          var fbusers = fbusers.val();
          allusers["students"][fbuser] = fbusers;
          allusers["allstudents"].push({name:fbusers.name, standard:fbusers.standard, division:fbusers.division, uid:fbuser});
          if(!allusers["classes"][fbusers.standard+'-'+fbusers.division]) {
            allusers["classes"][fbusers.standard+'-'+fbusers.division] = {standard:fbusers.standard, division:fbusers.division};
            allusers["allclasses"].push({standard:fbusers.standard, division:fbusers.division});
          }
          if(fbusers.division != "all") {
            if(!allusers["classes"][fbusers.standard]) {
              allusers["classes"][fbusers.standard] = {standard:fbusers.standard, division:fbusers.division};
              allusers["allclasses"].push({standard:fbusers.standard, division:"all"});
            }
          }
          for(var t in fbusers) {
            if(t.indexOf("simplelogin") != -1) {
              var tt = fbusers[t].split("_");
              var teacher = {
                name: tt[1],
                subject: tt[0],
                uid: t
              }
              if(!steacherindex[t]) {
                steacherindex[t] = true;
                allusers["allteachers"].push(teacher);
              }
            } 
          }
        });
        myCache.put("allusers", allusers);
        deferred.resolve(allusers);
      }, function(err) {
        deferred.reject(err);
      });
      return deferred.promise;
    },
    getAllMarks: function() {
      return $firebaseObject(ref.child(user.schoolid+'/marks'));
    },
    getMarks: function(key) {
      console.log("key in service", key);
      return $firebaseObject(ref.child(user.schoolid+'/marks/'+key));
    },
    getFilteredMarks: function(filter, key, sclass) {
      console.log("key in service", key);
      return ref.child(user.schoolid+'/marks/'+filter).orderByChild(key).equalTo(sclass);
    },
    getOverallMarks: function() {
      return ref.child(user.schoolid+'/marks');
    },
    wall: function(key) {
      console.log("wall key", key);
      return $firebaseArray(ref.child(key));
    },
    updateWall: function(key, update) {
      return ref.child(key).update(update);
    },
    getMenus: function() {
      if(user.role == "hm") {
        return menus.hmMenu;
      } else if (user.role == "parent") {
        if(user.students.length > 1) {
        /*  $rootScope.role = "parent";
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
          return parentMenu;*/
          return menus.parentSingleMenu;
        } else {
          return menus.parentSingleMenu;
        }
      } else {
        if(user.standard) {
          return menus.classTeacherMenu;
        } else {
          return menus.teacherMenu;
        }
      }      
    },
    resolveUser: function() {
      return ref.getAuth();
    },
    signedIn: function() {
      return ref.getAuth();
    },
    user: {},
    marks: {},
    allusers: {allclasses:[],classes:{},allstudents:[],students:{},allteachers:[], teachers:{}}
  };

  function authDataCallback(user) {
    console.log("user", user);
    if(user) {
      $rootScope.updateMenu = true;
    } else {
      $rootScope.updateMenu = false;
      console.log("logging out");
      localStorage.removeItem("user");
      user = {};
      $state.go('login', {}, {reload:true});
    }
  }

  ref.onAuth(authDataCallback);

/*  $rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams){ 
    if(toState.name == 'login') {
      console.log("user", user);
      if(user) {
        event.preventDefault();
        return false;
      }
    }
  })*/
  
  return Auth;
})
