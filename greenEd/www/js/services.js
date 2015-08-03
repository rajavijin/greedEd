angular.module('starter.services', [])

.factory('myCache', function($cacheFactory) {
  return $cacheFactory('myCache');
})

.factory('Auth', function ( $firebaseAuth, $q, $firebaseObject, $ionicLoading, myCache, $firebaseArray, FIREBASE_URL, $state, $rootScope) {
  var ref = new Firebase(FIREBASE_URL);
  var auth = $firebaseAuth(ref);

  var Auth = {
    login: function (userdata) {
      var defer = $q.defer();
      ref.authWithPassword(userdata, function(err, userdatafb) {
        if(err) {
          defer.reject(err);
        } else {
          $ionicLoading.hide();
          $ionicLoading.show({template:'<ion-spinner icon="lines" class="spinner-calm"></ion-spinner></br>Fetching user data...'});
          ref.child('users/'+userdatafb.uid).on('value', function(profilesnap) {
            user = profilesnap.val();
            user.uid = userdatafb.uid;
            var key = "usertype";
            var value = user.schoolid + '|student';
            if(user.role == 'teacher') {
              key = user.uid;
              for (var i = 0; i < user.subjects.length; i++) {
                if(i == 0) {
                  var tsub = user.subjects[i].subject;
                } else {
                  if(tsub != user.subjects[i].subject) tsub += ","+user.subjects[i].subject;
                }
              };
              value = user.name + "_" +tsub;
              user.alluserskey = key;
              user.allusersval = value;
              localStorage.setItem("user", JSON.stringify(user));
              defer.resolve(user);
            } else if (user.role == 'parent') {
              key = 'parentkids';
              value += '|'+user.uid;
              user.students = [];
              ref.child("users").orderByChild(key).equalTo(value).once('value', function(kidssnap) {
                kidssnap.forEach(function(student) {
                  var kid = student.val();
                  kid.uid = student.key();
                  user.students.push(kid);
                })
                localStorage.setItem("user", JSON.stringify(user));
                defer.resolve(user);
              })
            } else {
              user.alluserskey = key;
              user.allusersval = value;
              localStorage.setItem("user", JSON.stringify(user));
              defer.resolve(user);
            }
          });
        }
      });
      return defer.promise;
    },
    logout: function() {
      return ref.unauth();
    },
    filters: function(schoolid) {
      return $firebaseObject(ref.child(schoolid+"/filters"));
    },
    getUsers: function() {
      var deferred = $q.defer();
      var steacherindex = {};
      ref.child('users').orderByChild(user.alluserskey).equalTo(user.allusersval).once('value', function(usnap) {
        if(user.role == "hm") {
          var classes = {};
          var standard = {}
          var parents = {};
          var teachers = {};
          var chatcontacts = {};
          var allusers = {allclasses:[],allstudents:[],allteachers:[],chatcontacts:[],groups:{}};
          usnap.forEach(function(fbusers) {
            var fbuser = fbusers.key();
            var fbusers = fbusers.val();
            if(!allusers["groups"][fbusers.standard+'-'+fbusers.division]) allusers["groups"][fbusers.standard+'-'+fbusers.division] = [];
            if(!classes[fbusers.standard+'-'+fbusers.division]) {
              classes[fbusers.standard+'-'+fbusers.division] = true;
              allusers["allclasses"].push({standard:fbusers.standard, division:fbusers.division});  
              allusers["chatcontacts"].push({name: fbusers.standard+'-'+fbusers.division, role:"class", uid:fbusers.standard+'-'+fbusers.division,type:"group"})
            }

            if(!standard[fbusers.standard] && (fbusers.division != "all")) {
              standard[fbusers.standard] = true;
              allusers["allclasses"].push({standard:fbusers.standard, division:"all"});
            }
            allusers["allstudents"].push({name:fbusers.name, standard:fbusers.standard, division:fbusers.division, uid:fbuser});
            var parent = fbusers.parentkids.split("|");
            if(chatcontacts[fbusers.name]) {
              allusers["chatcontacts"][chatcontacts[fbusers.name] - 1].name += ","+fbusers.name;
              allusers["groups"][fbusers.standard+'-'+fbusers.division][chatcontacts[fbusers.name] - 1].name += ","+fbusers.name;
            } else {
              var cci = allusers["chatcontacts"].push({name: "Parent of "+fbusers.name, role:"parent", class:fbusers.standard+'-'+fbusers.division, uid:parent[2],type:"single"});
              allusers["groups"][fbusers.standard+'-'+fbusers.division].push({name: "Parent of "+fbusers.name, role:"parent", class:fbusers.standard+'-'+fbusers.division, uid:parent[2],type:"single"})
              chatcontacts[fbusers.name] = cci;
            }
            for(var t in fbusers) {
              if(t.indexOf("simplelogin") != -1) {
                var tt = fbusers[t].split("_");
                var teacher = {
                  name: tt[0],
                  subject: tt[1],
                  uid: t,
                  class: fbusers.standard+'-'+fbusers.division
                }
                if(!teachers[t]) {
                  teachers[t] = true;
                  allusers["allteachers"].push(teacher);
                  teacher.role = "teacher";
                  teacher.type = "single";
                  allusers["chatcontacts"].push(teacher);
                }
                allusers["groups"][fbusers.standard+'-'+fbusers.division].push(teacher);
              } 
            }
          });
        } else if (user.role == "teacher") {
          var classes = {};
          var standard = {}
          var parents = {};
          var chatcontacts = {};
          var allusers = {allstudents:[],chatcontacts:[],groups:{}};
          usnap.forEach(function(fbusers) {
            var fbuser = fbusers.key();
            var fbusers = fbusers.val();
            if(!allusers["groups"][fbusers.standard+'-'+fbusers.division]) allusers["groups"][fbusers.standard+'-'+fbusers.division] = [];
            if(!classes[fbusers.standard+'-'+fbusers.division]) {
              classes[fbusers.standard+'-'+fbusers.division] = true;
              allusers["chatcontacts"].push({name: fbusers.standard+'-'+fbusers.division, role:"class", uid:fbusers.standard+'-'+fbusers.division,type:"group"})
            }
            allusers["allstudents"].push({name:fbusers.name, standard:fbusers.standard, division:fbusers.division, uid:fbuser});
            var parent = fbusers.parentkids.split("_");
            if(chatcontacts[fbusers.name]) {
              allusers["chatcontacts"][chatcontacts[fbusers.name] - 1].name += ","+fbusers.name;
              allusers["groups"][fbusers.standard+'-'+fbusers.division][chatcontacts[fbusers.name] - 1].name += ","+fbusers.name;
            } else {
              var cci = allusers["chatcontacts"].push({name: "Parent of "+fbusers.name, role:"parent", class:fbusers.standard+'-'+fbusers.division, uid:parent[2],type:"single"});
              allusers["groups"][fbusers.standard+'-'+fbusers.division].push({name: "Parent of "+fbusers.name, role:"parent", class:fbusers.standard+'-'+fbusers.division, uid:parent[2],type:"single"})
              chatcontacts[fbusers.name] = cci;
            }
          });          
        }
        myCache.put("allusers", allusers);
        deferred.resolve(allusers);
      }, function(err) {
        deferred.reject(err);
      });
      return deferred.promise;
    },
    chats: function() {
      return $firebaseArray(ref.child(user.schoolid+"/chats"));
    },
    chatrooms: function() {
      return ref.child(user.schoolid+"/chatrooms");
    },
    getUserChatRooms: function() {
      return $firebaseObject(ref.child(user.schoolid+"/chatrooms/"+user.uid));
    },
    getAllMessages: function(chatid) {
      return ref.child(user.schoolid+"/chats/"+chatid);
    },
    getHm: function() {
      return ref.child("users").orderByChild("role").equalTo("hm");
    },
    getAllMarks: function() {
      return $firebaseObject(ref.child(user.schoolid+'/marks'));
    },
    getMarks: function(key) {
      return $firebaseObject(ref.child(user.schoolid+'/marks/'+key));
    },
    getFilteredMarks: function(filter, key, sclass) {
      return ref.child(user.schoolid+'/marks/'+filter).orderByChild(key).equalTo(sclass);
    },
    getOverallMarks: function() {
      return ref.child(user.schoolid+'/marks');
    },
    wall: function(key) {
      return $firebaseArray(ref.child(key));
    },
    updateWall: function(key, update) {
      return ref.child(key).update(update);
    },
    getTimetable: function(key) {
      return ref.child(user.schoolid+'/timetable/'+key);
    },
    getMenus: function() {
      if(user.role == "hm") {
        return {"Links":[{"title":"Dashboard", "href":"/app/hmdashboard", "class":"ion-stats-bars"},{"title":"Classes", "href":"/app/allclasses", "class": "ion-easel"},{"title":"Students", "href":"/app/allstudents", "class": "ion-person-stalker"},{"title":"Teachers", "href":"/app/allteachers", "class": "ion-ios-body"}]};
      } else if (user.role == "parent") {
        if(user.students.length > 1) {
          return {"Links":[{"title":"Dashboard", "href":"/app/studentdashboard", "class":"ion-stats-bars"},{"title":"Overall Dashboard", "href":"/app/studentoveralldashboard", "class":"ion-ios-pulse-strong"},{"title":"Class Dashboard", "href":"/app/classdashboard", "class":"ion-pie-graph"},{"title":"TimeTable", "href":"/app/timetable", "class":"ion-ios-time-outline"}]};
        } else {
          return {"Links":[{"title":"Dashboard", "href":"/app/studentdashboard/"+user.students[0].standard+"-"+user.students[0].division+"/"+user.students[0].uid+"/"+user.students[0].name, "class":"ion-stats-bars"},{"title":"Overall Dashboard", "href":"/app/studentoveralldashboard/"+user.students[0].uid+"/"+user.students[0].name, "class":"ion-ios-pulse-strong"},{"title":"Class Dashboard", "href":"/app/classdashboard/"+user.students[0].standard+"-"+user.students[0].division, "class":"ion-pie-graph"},{"title":"TimeTable", "href":"/app/timetable/"+user.students[0].standard+"-"+user.students[0].division, "class":"ion-ios-time-outline"}]};
        }
      } else {
        if(user.class) {
          return {"Links":[{"title":"Class Dashboard", "href":"/app/classdashboard/"+user.class, "class":"ion-stats-bars"},{"title":"Teacher Dashboard", "href":"/app/teacherdashboard/"+user.uid+"/"+user.name, "class":"ion-ios-pulse-strong"},{"title":"Students", "href":"/app/allstudents", "class": "ion-person-stalker"}]};
        } else {
          return {"Links":[{"title":"Dashboard", "href":"/app/teacherdashboard/"+user.uid+"/"+user.name, "class":"ion-stats-bars"},{"title":"Students", "href":"/app/allstudents", "class": "ion-person-stalker"}]};
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
    if(user) {
      $rootScope.updateMenu = true;
    } else {
      $rootScope.updateMenu = false;
      localStorage.removeItem("user");
      user = {};
      $state.go('login', {}, {reload:true});
    }
  }

  ref.onAuth(authDataCallback);  
  return Auth;
})
