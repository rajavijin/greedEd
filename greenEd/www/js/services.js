var online = true;
var ref = '';
var wallref = '';
var scrollRef = null;
var luser = localStorage.getItem('user');
if(luser) var user = JSON.parse(luser);
else var user = {};
var lfilter = localStorage.getItem('filters');
if(lfilter) var filters = angular.fromJson(lfilter);
else var filters = {};
var usersref = '';
var marksref = '';
var userchatroomsref = '';
var db = null;
var dashboards = {hm:false,class:false,teacher:false,student:false,overall:false};
var timetableref = {};
var days = {"holidays":{}, "events":{}, "exams":{}};
angular.module('starter.services', [])

.factory('myCache', function($cacheFactory) {
  return $cacheFactory('myCache');
})

.factory('Auth', function ( $firebaseAuth, $q, $firebaseObject, $ionicLoading, $cordovaSQLite, myCache, $firebaseArray, FIREBASE_URL, $state, $rootScope) {
  ref = new Firebase(FIREBASE_URL);
  ref.child('.info/connected').on('value', function(csnap) {
    online = csnap.val();
    $rootScope.$emit("online", online);
  });

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
            delete user.pepper;
            user.uid = userdatafb.uid;
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
                  var d = new Date();
                  var cy = d.getFullYear();
                  var st = kid.standard;
                  if((kid.division.length > 1) && (kid.division != "all")) st = st+"-"+kid.division;
                  days.exams[st] = $firebaseObject(ref.child(user.schoolid+"/exams/"+st+"/"+cy));
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
      $ionicLoading.show({template:'<ion-spinner icon="lines" class="spinner-calm"></ion-spinner></br>Logging out...'});
      auth.$unauth();
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
      console.log("getting marks", user.schoolid+'/marks/'+key);
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
    getExams: function(key) {
      var d = new Date();
      var cy = d.getFullYear();
      return ref.child(user.schoolid+"/exams/"+key+"/"+cy);
    },
    getUsers: function() {
      var deferred = $q.defer();
      var steacherindex = {};
      var classes = {};
      var standard = {}
      var parents = {};
      var teachers = {};
      var chatcontacts = {};
      var allusers = {allclasses:[],allstudents:[],allteachers:[],chatcontacts:[],groups:{}};
      usersref.$ref().on('value', function(usnap) {
        if(user.role == "hm") {
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
                    allusers["groups"][fbusers.standard+'-'+fbusers.division].push(teacher);
                  }
                } 
              }
            }
          });
        } else if (user.role == "teacher") {
          usnap.forEach(function(fbusers) {
            var fbuser = fbusers.key();
            var fbusers = fbusers.val();
            if(!allusers["groups"][fbusers.standard+'-'+fbusers.division]) allusers["groups"][fbusers.standard+'-'+fbusers.division] = [];
            if(!classes[fbusers.standard+'-'+fbusers.division]) {
              classes[fbusers.standard+'-'+fbusers.division] = true;
              allusers["allclasses"].push({standard:fbusers.standard, division:fbusers.division});
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
        Auth.saveLocal("allusers", allusers);
        deferred.resolve(allusers);
      }, function(err) {
        deferred.reject(err);
      });
      return deferred.promise;
    },
    getMenus: function() {
      if(user.role == "hm") {
        return {"Links":[{"title":"Dashboard", "href":"/app/hmdashboard", "class":"ion-stats-bars"},{"title":"Classes", "href":"/app/allclasses", "class": "ion-easel"},{"title":"Students", "href":"/app/allstudents", "class": "ion-person-stalker"},{"title":"Teachers", "href":"/app/allteachers", "class": "ion-ios-body"},{"title":"Exams", "href":"/app/allclasses/exams", "class": "ion-clipboard"}]};
      } else if (user.role == "parent") {
        if(user.students.length > 1) {
          return {"Links":[{"title":"Dashboard", "href":"/app/studentdashboard", "class":"ion-stats-bars"},{"title":"Overall Dashboard", "href":"/app/studentoveralldashboard", "class":"ion-ios-pulse-strong"},{"title":"Class Dashboard", "href":"/app/classdashboard", "class":"ion-pie-graph"},{"title":"TimeTable", "href":"/app/timetable", "class":"ion-ios-time"}]};
        } else {
          var st = user.students[0].standard;
          if((user.students[0].division.length > 1) && (user.students[0].division != "all")) st = st+"-"+user.students[0].division;
          return {"Links":[{"title":"Dashboard", "href":"/app/studentdashboard/"+user.students[0].standard+"-"+user.students[0].division+"/"+user.students[0].uid+"/"+user.students[0].name, "class":"ion-stats-bars"},{"title":"Overall Dashboard", "href":"/app/studentoveralldashboard/"+user.students[0].uid+"/"+user.students[0].name, "class":"ion-ios-pulse-strong"},{"title":"Class Dashboard", "href":"/app/classdashboard/"+user.students[0].standard+"-"+user.students[0].division, "class":"ion-pie-graph"},{"title":"TimeTable", "href":"/app/timetable/"+user.students[0].standard+"-"+user.students[0].division, "class":"ion-ios-time"},{"title":"Exams", "href":"/app/days/exams/"+st, "class":"ion-clipboard"}]};
        }
      } else {
        // if(user.class) {
        //   return {"Links":[{"title":"Class Dashboard", "href":"/app/classdashboard/"+user.class, "class":"ion-stats-bars"},{"title":"Teacher Dashboard", "href":"/app/teacherdashboard/"+user.uid+"/"+user.name, "class":"ion-ios-pulse-strong"},{"title":"Students", "href":"/app/allstudents", "class": "ion-person-stalker"},{"title":"Classes", "href":"/app/allclasses", "class": "ion-easel"},{"title":"TimeTable", "href":"/app/timetable/"+user.uid, "class":"ion-ios-time"},{"title":"Exams", "href":"/app/allclasses/exams", "class": "ion-clipboard"}]};
        // } else {
        return {"Links":[{"title":"Dashboard", "href":"/app/teacherdashboard/"+user.uid+"/"+user.name, "class":"ion-stats-bars"},{"title":"Students", "href":"/app/allstudents", "class": "ion-person-stalker"},{"title":"Classes", "href":"/app/allclasses", "class": "ion-easel"},{"title":"TimeTable", "href":"/app/timetable/"+user.uid, "class":"ion-ios-time"},{"title":"Exams", "href":"/app/allclasses/exams", "class": "ion-clipboard"}]};
        //}
      }      
    },
    saveLocal: function(lkey, lalldata) {
      var defer = $q.defer();
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

angular.module('issue-9128-patch', [])
    .config(['$provide', function($provide){
      
      $provide.decorator('$rootScope', ['$delegate', function($rootScope) {
        var _proto
          , _new
          , nextUid = function() {
              return ++$rootScope.$id;
            }
          , Scope = function() {
              this.$id = nextUid();
              this.$$phase = this.$parent = this.$$watchers = this.$$nextSibling = this.$$prevSibling = this.$$childHead = this.$$childTail = null;
              this.$root = this;
              this.$$destroyed = false;
              this.$$listeners = {};
              this.$$listenerCount = {};
              this.$$isolateBindings = null;
            };

        _proto = Object.create(Object.getPrototypeOf($rootScope));
        Scope.prototype = _proto;

        _new = function(isolate, parent) {
         var child;

          parent = parent || this;

          if (isolate) {
            child = new Scope();
            child.$root = this.$root;
          } else {
            // Only create a child scope class if somebody asks for one,
            // but cache it to allow the VM to optimize lookups.

            if(!this.$$ChildScope) {
              this.$$ChildScope = function ChildScope() {
                this['$$watchers'] = this['$$nextSibling'] = this['$$childHead'] = this['$$childTail'] = null;
                this['$$listeners'] = {};
                this['$$listenerCount'] = {};
                this['$id'] = nextUid();
                this['$$ChildScope'] = null;
              };
              this['$$ChildScope'].prototype = this;
            }
            child = new this.$$ChildScope();
          }
          child['$parent'] = parent;
          child['$$prevSibling'] = parent.$$childTail;
          if (parent.$$childHead) {
            parent.$$childTail.$$nextSibling = child;
            parent.$$childTail = child;
          } else {
            parent.$$childHead = parent.$$childTail = child;
          }

          // When the new scope is not isolated or we inherit from `this`, and
          // the parent scope is destroyed, the property `$$destroyed` is inherited
          // prototypically. In all other cases, this property needs to be set
          // when the parent scope is destroyed.
          // The listener needs to be added after the parent is set
          if (isolate || parent != this) {
            child.$on('$destroy', destroyChild);
          }

          return child;

          function destroyChild() {
            child.$$destroyed = true;
          }
        };

        $rootScope.$new = _new;
        return $rootScope;
      }]);

    }]);