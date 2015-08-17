var online = true;
var ref = '';
angular.module('starter.services', [])

.factory('myCache', function($cacheFactory) {
  return $cacheFactory('myCache');
})

.factory('Auth', function ( $firebaseAuth, $q, $firebaseObject, $ionicLoading, $cordovaSQLite, myCache, $firebaseArray, FIREBASE_URL, $state, $rootScope) {
  ref = new Firebase(FIREBASE_URL);
  var auth = $firebaseAuth(ref);
  ref.child('.info/connected').on('value', function(csnap) {console.log("online root", csnap.val()); online = csnap.val();});
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
            delete user.pepper;
            wallref = $firebaseArray(ref.child(user.schoolid+"/wall"));
            $rootScope.filters = $firebaseObject(ref.child(user.schoolid+"/filters"));
            user.uid = userdatafb.uid;
            userchatroomsref = $firebaseObject(ref.child(user.schoolid+"/chatrooms/"+user.uid));
            var key = "usertype";
            var value = user.schoolid + '|student';
            if(user.role == 'teacher') {
              key = user.uid;
              for (var i = 0; i < user.subjects.length; i++) {
                if(i == 0) {
                  var tsub = user.subjects[i].subject;
                }
              };
              value = user.name + "_" +tsub;
              user.alluserskey = key;
              user.allusersval = value;
              if(user.uid == 'simplelogin:2') user.class = "6-all";
              usersref = $firebaseObject(ref.child('users').orderByChild(user.alluserskey).equalTo(user.allusersval));
              timetableref[user.uid] = ref.child(user.schoolid+'/timetable/'+user.uid);
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
                  timetableref[kid.uid] = ref.child(user.schoolid+'/timetable/'+kid.uid);
                })
                localStorage.setItem("user", JSON.stringify(user));
                defer.resolve(user);
              })
            } else {
              user.alluserskey = key;
              user.allusersval = value;
              usersref = $firebaseObject(ref.child('users').orderByChild(user.alluserskey).equalTo(user.allusersval));
              localStorage.setItem("user", JSON.stringify(user));
              defer.resolve(user);
            }
          });
        }
      });
      return defer.promise;
    },
    logout: function() {
      $cordovaSQLite.execute(db, "DROP TABLE mydata");
      return ref.unauth();
    },
    filters: function(schoolid) {
      return $firebaseObject(ref.child(schoolid+"/filters"));
    },
    chats: function() {
      return $firebaseArray(ref.child(user.schoolid+"/chats"));
    },
    chatrooms: function() {
      return ref.child(user.schoolid+"/chatrooms");
    },
    getUserChatRooms: function() {
      return userchatroomsref;
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
      return wallref;
    },
    updateWall: function(key, update) {
      return ref.child(key).update(update);
    },
    getTimetable: function(key) {
      return ref.child(user.schoolid+'/timetable/'+key);
    },
    getUsers: function() {
      var deferred = $q.defer();
      var steacherindex = {};
      console.log("usersref", usersref);
      usersref.$ref().on('value', function(usnap) {
        console.log("usnap", usnap);
        if(user.role == "hm") {
          var classes = {};
          var standard = {}
          var parents = {};
          var teachers = {};
          var chatcontacts = {};
          var allusers = {allclasses:[],allstudents:[],allteachers:[],chatcontacts:[],groups:{}};
          usnap.forEach(function(iusnap) {
            var fbuser = iusnap.key();
            var fbusers = iusnap.val();
            if((fbuser != "$$conf") || (fbuser != "$id") || (fbuser != "$priority")) {
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
              allusers["allstudents"].push({name:fbusers.name, studentid:fbusers.studentid, standard:fbusers.standard, division:fbusers.division, uid:fbuser});
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
            var parent = fbusers.parentkids.split("|");
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
        Auth.saveLocal("allusers", allusers).then(function(status) {console.log("status", status);});
        //myCache.put("allusers", allusers);
        deferred.resolve(allusers);
      }, function(err) {
        deferred.reject(err);
      });
      return deferred.promise;
    },
    getMenus: function() {
      if(user.role == "hm") {
        return {"Links":[{"title":"Dashboard", "href":"/app/hmdashboard", "class":"ion-stats-bars"},{"title":"Classes", "href":"/app/allclasses", "class": "ion-easel"},{"title":"Students", "href":"/app/allstudents", "class": "ion-person-stalker"},{"title":"Teachers", "href":"/app/allteachers", "class": "ion-ios-body"}]};
      } else if (user.role == "parent") {
        if(user.students.length > 1) {
          return {"Links":[{"title":"Dashboard", "href":"/app/studentdashboard", "class":"ion-stats-bars"},{"title":"Overall Dashboard", "href":"/app/studentoveralldashboard", "class":"ion-ios-pulse-strong"},{"title":"Class Dashboard", "href":"/app/classdashboard", "class":"ion-pie-graph"},{"title":"TimeTable", "href":"/app/timetable", "class":"ion-ios-time"}]};
        } else {
          return {"Links":[{"title":"Dashboard", "href":"/app/studentdashboard/"+user.students[0].standard+"-"+user.students[0].division+"/"+user.students[0].uid+"/"+user.students[0].name, "class":"ion-stats-bars"},{"title":"Overall Dashboard", "href":"/app/studentoveralldashboard/"+user.students[0].uid+"/"+user.students[0].name, "class":"ion-ios-pulse-strong"},{"title":"Class Dashboard", "href":"/app/classdashboard/"+user.students[0].standard+"-"+user.students[0].division, "class":"ion-pie-graph"},{"title":"TimeTable", "href":"/app/timetable/"+user.students[0].standard+"-"+user.students[0].division, "class":"ion-ios-time"}]};
        }
      } else {
        if(user.class) {
          return {"Links":[{"title":"Class Dashboard", "href":"/app/classdashboard/"+user.class, "class":"ion-stats-bars"},{"title":"Teacher Dashboard", "href":"/app/teacherdashboard/"+user.uid+"/"+user.name, "class":"ion-ios-pulse-strong"},{"title":"Students", "href":"/app/allstudents", "class": "ion-person-stalker"},{"title":"TimeTable", "href":"/app/timetable/"+user.uid, "class":"ion-ios-time"}]};
        } else {
          return {"Links":[{"title":"Dashboard", "href":"/app/teacherdashboard/"+user.uid+"/"+user.name, "class":"ion-stats-bars"},{"title":"Students", "href":"/app/allstudents", "class": "ion-person-stalker"},{"title":"TimeTable", "href":"/app/timetable/"+user.uid, "class":"ion-ios-time"}]};
        }
      }      
    },
    saveLocal: function(lkey, lalldata) {
      var defer = $q.defer();
      $cordovaSQLite.execute(db, "SELECT value from mydata where key = ?", [lkey]).then(function(res) {
        console.log("Local Data status", res.rows.length);
        if(res.rows.length > 0) {
          $cordovaSQLite.execute(db, "UPDATE mydata SET value = ? WHERE key = ?", [angular.toJson(lalldata),lkey]).then(function(ures) {
            console.log("UPDATED ID -> " + ures);
            defer.resolve("updated");
          }, function (err) {
            defer.reject(err);
          }); 
        } else {
          $cordovaSQLite.execute(db, "INSERT INTO mydata (key, value) VALUES (?, ?)", [lkey, angular.toJson(lalldata)]).then(function(ires) {
            console.log("INSERT ID -> " + ires.insertId);
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
      return ref.getAuth();
    }
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
