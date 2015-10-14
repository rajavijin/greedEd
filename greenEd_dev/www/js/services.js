var online = true;
var ref = '';
var wallref = '';
var classcount = {};
var scrollRef = null;
var luser = localStorage.getItem('user');
if(luser) var user = JSON.parse(luser);
else var user = {};
var lfilter = localStorage.getItem('filters');
if(lfilter) var filters = angular.fromJson(lfilter);
else var filters = {};
var userRef = '';
var marksref = '';
var userchatroomsref = '';
var chatrooms = null;
var db = null;
var dashboards = {hm:false,class:false,teacher:false,student:false,overall:false};
var timetableref = {};
var days = {"holidays":[], "events":[], "exams":[]};
angular.module('starter.services', [])

.factory('myCache', function($cacheFactory) {
  return $cacheFactory('myCache');
})

.factory('Auth', function ( $firebaseAuth, S_ID, $q, $firebaseObject, $ionicLoading, $cordovaSQLite, myCache, $firebaseArray, FIREBASE_URL, $state, $rootScope) {
  ref = new Firebase(FIREBASE_URL);
  ref.child('.info/connected').on('value', function(csnap) {
    online = csnap.val();
    $rootScope.$emit("online", online);
  });
  $rootScope.homeworks = {};
  var auth = $firebaseAuth(ref);
  var Auth = {
    login: function (userdata) {
      var defer = $q.defer();
      var index = 0;
      if((index = userdata.username.indexOf("h")) != -1) {
        userdata.role = "hm";
      } else if ((index = userdata.username.indexOf("t")) != -1) {
        userdata.role = "teacher";
      } else if ((index = userdata.username.indexOf("p")) != -1) {
        userdata.role = "parent";
      } else if ((index = userdata.username.indexOf("ss")) != -1) {
        userdata.role = "student";
      }
      user.schoolid = S_ID;
      ref.authWithPassword({email: userdata.username + "@ge.com", password: userdata.password}, function(err, userdatafb) {
        if(err) {
          defer.reject(err);
        } else {
          console.log("user data", userdatafb);
          $ionicLoading.hide();
          $ionicLoading.show({template:'<ion-spinner icon="lines" class="spinner-calm"></ion-spinner></br>Fetching user data...'});
          if(userdata.role == "parent") {
            user.uid = userdatafb.uid;
            user.role = "parent";
            user.students = [];
            ref.child(S_ID+"/users/student").orderByChild("pid").equalTo(userdatafb.uid).on('value', function(kidssnap) {
              kidssnap.forEach(function(student) {
                var kid = student.val();
                kid.uid = student.key();
                user.name = kid.parent;
                user.students.push(kid);
                timetableref[kid.uid] = ref.child(S_ID+'/timetable/'+kid.standard+'-'+kid.division);
                $rootScope.homeworks[kid.uid] = $firebaseArray(ref.child(S_ID+'/homeworks').limitToLast(50));
              })
              localStorage.setItem("user", JSON.stringify(user));
              defer.resolve(user);
            });
          } else if (userdata.role == "teacher") {
            ref.child(S_ID+'/users/'+userdata.role+'/'+userdatafb.uid).on('value', function(profilesnap) {
              user = profilesnap.val();
              delete user.pepper;
              user.uid = userdatafb.uid;
              userchatroomsref = $firebaseObject(ref.child(S_ID+"/chatrooms/"+user.uid));
              $rootScope.homeworks[user.uid] = $firebaseArray(ref.child(S_ID+'/homeworks').limitToLast(50));
              userRef = $firebaseObject(ref.child(S_ID+'/users/student'));
              timetableref[user.uid] = ref.child(S_ID+'/timetable/'+user.uid);
              localStorage.setItem("user", JSON.stringify(user));
              defer.resolve(user);            
            });
          } else if (userdata.role == "student") {

          } else {
            userRef = $firebaseObject(ref.child(S_ID+'/users/student'));
            ref.child(S_ID+'/users/'+userdata.role+'/'+userdatafb.uid).on('value', function(profilesnap) {
              user = profilesnap.val();
              delete user.pepper;
              user.uid = userdatafb.uid;
              localStorage.setItem("user", JSON.stringify(user));
              defer.resolve(user);
            });
          }
        }
      });
      return defer.promise;
    },
    logout: function() {
      $ionicLoading.show({template:'<ion-spinner icon="lines" class="spinner-calm"></ion-spinner></br>Logging out...'});
      auth.$unauth();
    },
    filters: function(schoolid) {
      return $firebaseObject(ref.child(schoolid+"/filters"));
    },
    chats: function() {
      return $firebaseArray(ref.child(S_ID+"/chats"));
    },
    chatrooms: function() {
      return ref.child(S_ID+"/chatrooms");
    },
    getUserChatRooms: function() {
      if(userchatroomsref) return userchatroomsref;
      else return $firebaseObject(ref.child(S_ID+"/chatrooms/"+user.uid));
    },
    getAllMessages: function(chatid) {
      return ref.child(S_ID+"/chats/"+chatid);
    },
    getHm: function() {
      return ref.child("users").orderByChild("role").equalTo("hm");
    },
    getAllMarks: function() {
      return $firebaseObject(ref.child(S_ID+'/marks'));
    },
    getMarks: function(key) {
      return $firebaseObject(ref.child(S_ID+'/marks/'+key));
    },
    getFilteredMarks: function(filter, key, sclass) {
      return ref.child(S_ID+'/marks/'+filter).orderByChild(key).equalTo(sclass);
    },
    getOverallMarks: function() {
      return ref.child(S_ID+'/marks');
    },
    wall: function(key) {
      return wallref;
    },
    updateWall: function(key, update) {
      return ref.child(key).update(update);
    },
    getTimetable: function(key) {
      return ref.child(S_ID+'/timetable/'+key);
    },
    getExams: function(key, start) {
      return ref.child(S_ID+"/exams/"+key).orderByChild("id").startAt(start);
    },
    getUsers: function() {
      var deferred = $q.defer();
      userRef.$ref().on('value', function(usnap) {
        var steacherindex = {};
        var classes = {};
        var standard = {}
        var parents = {};
        var teachers = {};
        var chatcontacts = {};
        var allusers = {allclasses:[],allstudents:[],allteachers:[],chatcontacts:[],groups:{}};
        usnap.forEach(function(iusnap) {
          var fbuser = iusnap.key();
          var fbusers = iusnap.val();
          console.log("fbusers", fbusers);
          console.log("fbuser", fbuser);
          var sclass = fbusers.standard+'-'+fbusers.division;
          if(!allusers["groups"][sclass]) allusers["groups"][sclass] = [];
          if(!classes[sclass]) {
            classes[sclass] = true;
            allusers["allclasses"].push({standard:fbusers.standard, division:fbusers.division});  
            allusers["chatcontacts"].push({name: sclass, role:"class", uid:sclass,type:"group"})
          }

          // if(!standard[fbusers.standard] && (fbusers.division != "all")) {
          //   standard[fbusers.standard] = true;
          //   allusers["allclasses"].push({standard:fbusers.standard, division:"all"});
          // }
          allusers["allstudents"].push({name:fbusers.name, studentid:fbusers.studentid, standard:fbusers.standard, division:fbusers.division, uid:fbuser, sex:fbusers.sex});
          if(chatcontacts[fbusers.name]) {
            allusers["chatcontacts"][chatcontacts[fbusers.name] - 1].name += ","+fbusers.name;
            allusers["groups"][sclass][chatcontacts[fbusers.name] - 1].name += ","+fbusers.name;
          } else {
            var cci = allusers["chatcontacts"].push({name: "Parent of "+fbusers.name, role:"parent", class:sclass, uid:fbusers.pid,type:"single"});
            allusers["groups"][sclass].push({name: "Parent of "+fbusers.name, role:"parent", class:sclass, uid:fbusers.pid,type:"single"})
            chatcontacts[fbusers.name] = cci;
          }
          if (user.role == "hm") {
            for (var si = 0; si < fbusers.subjects.length; si++) {
              if(!steacherindex[fbusers.subjects[si].tid]) {
                steacherindex[fbusers.subjects[si].tid] = true;
                var teacher = { name: fbusers.subjects[si].tname, uid: fbusers.subjects[si].tid};
                allusers["allteachers"].push(teacher);
                teacher.type = "single";
                allusers["chatcontacts"].push(teacher);
                if(!allusers["groups"][sclass]) allusers["groups"][sclass] = [];
                allusers["groups"][sclass].push(teacher);
              }
            };
          }
        });
        console.log("All users from fb", allusers);    
        Auth.saveLocal("allusers", allusers);
        deferred.resolve(allusers);
      }, function(err) {
        deferred.reject(err);
      });
      return deferred.promise;
    },
    getMenus: function() {
      if(user.role == "hm") {
        return {"Links":[
        {"title":"Dashboard", "href":"/app/hmdashboard", "class":"ion-stats-bars"},
        {"title":"Classes", "href":"/app/allclasses", "class": "ion-easel"},
        {"title":"Students", "href":"/app/allstudents", "class": "ion-person-stalker"},
        {"title":"Teachers", "href":"/app/allteachers", "class": "ion-ios-body"}]};
      } else if (user.role == "parent") {
        if(user.students.length > 1) {
          return {"Links":[
          {"title":"Dashboard", "href":"/app/studentdashboard", "class":"ion-stats-bars"},
          {"title":"Class Dashboard", "href":"/app/classdashboard", "class":"ion-pie-graph"},
          {"title":"Bus tracking", "href":"/app/bustracking", "class":"ion-android-bus"},
          {"title":"TimeTable", "href":"/app/timetable", "class":"ion-ios-time"}
          ]};
        } else {
          var st = user.students[0].standard;
          if((user.students[0].division.length > 1) && (user.students[0].division != "all")) st = st+"-"+user.students[0].division;
          return {"Links":[
          {"title":"Homeworks", "href":"/app/homeworks/"+user.students[0].uid, "class":"ion-android-list"},
          {"title":"Dashboard", "href":"/app/studentdashboard/"+user.students[0].standard+"-"+user.students[0].division+"/"+user.students[0].uid+"/"+user.students[0].name, "class":"ion-stats-bars"},
          {"title":"Class Dashboard", "href":"/app/classdashboard/"+user.students[0].standard+"-"+user.students[0].division, "class":"ion-pie-graph"},
          {"title":"Bus tracking", "href":"/app/bustracking", "class":"ion-android-bus"},
          {"title":"TimeTable", "href":"/app/timetable/"+user.students[0].standard+"-"+user.students[0].division, "class":"ion-ios-time"},
          {"title":"Favourite Teacher", "href":"/app/favteacher/0", "class":"ion-thumbsup"}]};
        }
      } else {
        // if(user.class) {
        //   return {"Links":[{"title":"Class Dashboard", "href":"/app/classdashboard/"+user.class, "class":"ion-stats-bars"},{"title":"Teacher Dashboard", "href":"/app/teacherdashboard/"+user.uid+"/"+user.name, "class":"ion-ios-pulse-strong"},{"title":"Students", "href":"/app/allstudents", "class": "ion-person-stalker"},{"title":"Classes", "href":"/app/allclasses", "class": "ion-easel"},{"title":"TimeTable", "href":"/app/timetable/"+user.uid, "class":"ion-ios-time"},{"title":"Exams", "href":"/app/allclasses/exams", "class": "ion-clipboard"}]};
        // } else {
        return {"Links":[
        {"title":"Dashboard", "href":"/app/teacherdashboard/"+user.uid+"/"+user.name, "class":"ion-stats-bars"},
        {"title":"Students", "href":"/app/allstudents", "class": "ion-person-stalker"},
        {"title":"Classes", "href":"/app/allclasses", "class": "ion-easel"},
        {"title":"Add HomeWork", "href":"/app/teacherclasses", "class":"ion-plus-circled"},
        {"title":"Homeworks", "href":"/app/homeworks/"+user.uid, "class":"ion-android-list"},
        {"title":"TimeTable", "href":"/app/timetable/"+user.uid, "class":"ion-ios-time"}
        ]};
        //}
      }      
    },
    saveLocal: function(lkey, ldata) {
      var defer = $q.defer();
      if(ldata["$$conf"]) {
        delete ldata["$$conf"];
        delete ldata["$priority"];
        delete ldata["$id"];
        var lalldata = ldata;
      } else if (ldata["$add"]) {
        var lalldata = angular.copy(ldata);
      } else {
        var lalldata = ldata;
      }
      $cordovaSQLite.execute(db, "SELECT value from mydata where key = ?", [lkey]).then(function(res) {
        if(res.rows.length > 0) {
          $cordovaSQLite.execute(db, "UPDATE mydata SET value = ? WHERE key = ?", [angular.toJson(lalldata),lkey]).then(function(ures) {
            defer.resolve("updated");
          }, function (err) {
            defer.reject(err);
          }); 
        } else {
          $cordovaSQLite.execute(db, "INSERT INTO mydata (key, value) VALUES (?, ?)", [lkey, angular.toJson(lalldata)]).then(function(ires) {
            defer.resolve("Inserted");
          }, function (err) {
            console.error(err);
            defer.reject(err);
          });
        }
      })
      return defer.promise;
    },
    resolveUser: function() {
      return ref.getAuth();
    },
    signedIn: function() {
      var defer = $q.defer();
      var authdata = ref.getAuth();
      if(authdata.uid) {
        defer.resolve("loggedin");
      } else {
        defer.reject("loggedout");
      }
      return defer.promise;
    }
  };

  auth.$onAuth(function(authData) {
    if(authData) {
      $rootScope.updateMenu = true;
    } else {
      $rootScope.updateMenu = false;
      localStorage.removeItem("user");
      if(db) $cordovaSQLite.execute(db, "DROP TABLE mydata");
    }
  });
  
  return Auth;
})