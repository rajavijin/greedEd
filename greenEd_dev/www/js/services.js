var online = true;
var ref = '';
var wallref = '';
var classcount = {};
var scrollRef = null;
var luser = localStorage.getItem('user');
if(luser) var user = JSON.parse(luser);
else var user = {};
var lschool = localStorage.getItem('school');
if(lschool) var school = JSON.parse(lschool);
else var school = {};
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

var months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
var MONTHS = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAI', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
var WEEKDAYS = ['SUNDAY' , 'MONDAY' , 'TUESDAY' , 'WEDNESDAY' , 'THURSDAY' , 'FRIDAY' , 'SATURDAY'];
var currentEducationYear = function(period) {
  var monthVal = period.split("-");
  var startRange = MONTHS[monthVal[0].toUpperCase()];
  var d = new Date();
  var year = d.getFullYear();
  if(d.getMonth() < startRange) return (year - 1) + "-" + year;
  else return year + "-" + (year + 1);
}

angular.module('starter.services', [])

.factory('Auth', function ( $firebaseAuth, S_ID, S_ID_key, $q, $firebaseObject, $ionicLoading, $cordovaSQLite, $firebaseArray, FIREBASE_URL, $state, $rootScope, $timeout) {
  console.log("user", user);
  if(user.uid) $ionicLoading.show({template:'<ion-spinner icon="lines" class="spinner-calm"></ion-spinner></br>Please wait while fetching data...'});
  $rootScope.homeworks = {};
  $rootScope.viewAttendance = {};
  $rootScope.points = {};
  ref = new Firebase(FIREBASE_URL);
  ref.child('.info/connected').on('value', function(csnap) {
    online = csnap.val();
    $timeout(function() { if(!online) $ionicLoading.hide();}, 4000);
    $rootScope.$emit("online", online);
  });
  chatrooms = $firebaseObject(ref.child(S_ID+"/chatrooms"));
  $rootScope.calendar = $firebaseArray(ref.child(S_ID+"/calendar"));
  var schoolRefP = ref.child("schools/"+S_ID_key);
  var schoolRef = $firebaseObject(schoolRefP);
  schoolRef.$bindTo($rootScope, "school");
  schoolRefP.on('value', function(schoolSnap) {
    school = schoolSnap.val();
    localStorage.setItem('school', JSON.stringify(school));
  });
  scrollRef = new Firebase.util.Scroll(ref.child(S_ID+"/wall"), '$priority');
  $rootScope.walls = $firebaseArray(scrollRef);
  scrollRef.scroll.next(20);
  $rootScope.walls.scroll = scrollRef.scroll;
  $rootScope.walls.$loaded().then(function(dsnap) {
    console.log("walls", $rootScope.walls);
    $timeout(function() { $ionicLoading.hide();}, 1000);
  })
  var auth = $firebaseAuth(ref);
  var Auth = {
    authInit: function(uData) {
      userchatroomsref = $firebaseObject(ref.child(S_ID+"/chatrooms/"+uData.uid));
      if(uData.role == 'parent') {
        for (var i = 0; i < uData.students.length; i++) {
          var st = uData.students[i].standard;
          if((uData.students[i].division.length > 1) && (uData.students[i].division != "all")) st = st+"-"+uData.students[i].division;
          timetableref[uData.students[i].uid] = ref.child(S_ID+'/timetable/'+uData.students[i].standard+'-'+uData.students[i].division);
          $rootScope.homeworks[uData.students[i].uid] = $firebaseArray(ref.child(S_ID+'/homeworks').limitToLast(50));
          $rootScope.viewAttendance[uData.students[i].uid] = $firebaseObject(ref.child(S_ID+'/attendance/'+currentEducationYear(school.period)+'/'+uData.students[i].standard+'-'+uData.students[i].division));
          $rootScope.points[uData.students[i].uid] = $firebaseObject(ref.child(S_ID+'/points/'+currentEducationYear(school.period)+'/'+uData.students[i].standard+'-'+uData.students[i].division+'/'+uData.students[i].uid));
        };
      } else if (uData.role == 'teacher') {
        userRef = $firebaseObject(ref.child(S_ID+'/users/student'));
        timetableref[uData.uid] = ref.child(S_ID+'/timetable/'+uData.uid);
        $rootScope.homeworks[uData.uid] = $firebaseArray(ref.child(S_ID+'/homeworks').limitToLast(50));
        $rootScope.hm = $firebaseObject(ref.child(S_ID+'/users/hm'));
        var attendanceRef = $firebaseObject(ref.child(S_ID+'/attendance/'+currentEducationYear(school.period)+'/'+user.class));
        attendanceRef.$bindTo($rootScope, "attendance");
        var pointsRef = $firebaseObject(ref.child(S_ID+'/points/'+currentEducationYear(school.period)));
        pointsRef.$bindTo($rootScope, "rewards");
      } else {
        userRef = $firebaseObject(ref.child(S_ID+'/users/student'));
        var attendanceRef = $firebaseObject(ref.child(S_ID+'/attendance/'+currentEducationYear(school.period)));
        attendanceRef.$bindTo($rootScope, "attendance");
        var pointsRef = $firebaseObject(ref.child(S_ID+'/points/'+currentEducationYear(school.period)));
        pointsRef.$bindTo($rootScope, "rewards");
      }

      return true;
    },

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
                $rootScope.viewAttendance[kid.uid] = $firebaseObject(ref.child(S_ID+'/attendance/'+currentEducationYear(school.period)+'/'+kid.standard+'-'+kid.division));
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
              userRef = $firebaseObject(ref.child(S_ID+'/users/student'));
              $rootScope.homeworks[user.uid] = $firebaseArray(ref.child(S_ID+'/homeworks').limitToLast(50));
              var attendanceRef = $firebaseObject(ref.child(S_ID+'/attendance/'+currentEducationYear(school.period)+'/'+user.class));
              attendanceRef.$bindTo($rootScope, "attendance");
              var pointsRef = $firebaseObject(ref.child(S_ID+'/points/'+currentEducationYear(school.period)));
              pointsRef.$bindTo($rootScope, "rewards");
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
              var attendanceRef = $firebaseObject(ref.child(S_ID+'/attendance/'+currentEducationYear(school.period)+'/'+user.class));
              attendanceRef.$bindTo($rootScope, "attendance");
              var pointsRef = $firebaseObject(ref.child(S_ID+'/points/'+currentEducationYear(school.period)));
              pointsRef.$bindTo($rootScope, "rewards");
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
          allusers["allstudents"].push({name:fbusers.name, studentid:fbusers.id, standard:fbusers.standard, division:fbusers.division, uid:fbuser, sex:fbusers.sex, present: true});
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
          {"title":"Attendance", "href":"/app/attendance/"+user.students[0].uid, "class":"ion-checkmark-round"},
          {"title":"Points", "href":"/app/points/"+user.students[0].uid+"/"+user.students[0].standard+"-"+user.students[0].division+"/"+user.students[0].name, "class":"ion-thumbsup"},
          {"title":"Dashboard", "href":"/app/studentdashboard/"+user.students[0].standard+"-"+user.students[0].division+"/"+user.students[0].uid+"/"+user.students[0].name, "class":"ion-stats-bars"},
          {"title":"Class Dashboard", "href":"/app/classdashboard/"+user.students[0].standard+"-"+user.students[0].division, "class":"ion-pie-graph"},
          {"title":"Bus tracking", "href":"/app/bustracking", "class":"ion-android-bus"},
          {"title":"TimeTable", "href":"/app/timetable/"+user.students[0].standard+"-"+user.students[0].division, "class":"ion-ios-time"},
          {"title":"Favourite Teacher", "href":"/app/favteacher/0", "class":"ion-thumbsup"},
          {"title":user.students[0].name, "href":"/app/kid/"+user.students[0].uid+"/"+user.students[0].name+"/0", "class":"ion-person"}]};
        }
      } else {
        // if(user.class) {
        //   return {"Links":[{"title":"Class Dashboard", "href":"/app/classdashboard/"+user.class, "class":"ion-stats-bars"},{"title":"Teacher Dashboard", "href":"/app/teacherdashboard/"+user.uid+"/"+user.name, "class":"ion-ios-pulse-strong"},{"title":"Students", "href":"/app/allstudents", "class": "ion-person-stalker"},{"title":"Classes", "href":"/app/allclasses", "class": "ion-easel"},{"title":"TimeTable", "href":"/app/timetable/"+user.uid, "class":"ion-ios-time"},{"title":"Exams", "href":"/app/allclasses/exams", "class": "ion-clipboard"}]};
        // } else {
        return {"Links":[
        {"title":"Dashboard", "href":"/app/teacherdashboard/"+user.uid+"/"+user.name, "class":"ion-stats-bars"},
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
    }
  });
  
  return Auth;
})