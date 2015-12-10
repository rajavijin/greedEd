angular.module('starter.controllers', [])

.controller('AppCtrl', function($scope, $window, $rootScope, Auth, $state, $ionicLoading, $timeout) {
  $scope.logout = function() {
    Auth.logout();
    $state.go("login");
  }
  if(user) {
    $scope.menuLinks = Auth.getMenus();
  } else {
    $state.go("login");
  }
  $rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams, rejection){
    $rootScope.fromState = fromState.name;
    $rootScope.currentState = toState.name;
    if(toState.name == "login") {
      $timeout(function() { 
        $ionicLoading.hide();
        //$window.location.reload(true);
      }, 1500);
    }
  });
  $scope.user = user;
})

.controller("AddHomeWorkCtrl", function($scope, Auth, $stateParams, $state, $cordovaSQLite, $rootScope, S_ID) {
  $scope.defaultDueDate = new Date(new Date().getTime() + 24 * 60 * 60 * 1000);
  $scope.hdata = {class:$stateParams.class, ack:{}, status: false, done:0, subject:$stateParams.subject, tid:user.uid, date: moment().valueOf(), $priority: 0 - moment().valueOf()};
  var processUsers = function(allstudents) {
    classcount[$stateParams.class] = 0;
    for (var i = 0; i < allstudents.length; i++) {
      if(allstudents[i].standard+'-'+allstudents[i].division == $stateParams.class) {
        classcount[$stateParams.class]++;
      }
    }
    $scope.hdata.undone = classcount[$stateParams.class];
  }
  if(classcount[$stateParams.class]) {
    $scope.hdata.undone = classcount[$stateParams.class];
  } else {
    if(online) {
      Auth.getUsers().then(function(allusersfb) {
        processUsers(allusersfb["allstudents"]);
      })
    } else {
      if(db) {
        $cordovaSQLite.execute(db, "SELECT value FROM mydata WHERE key = ?", ["allusers"]).then(function(res) {
          if(res.rows.length > 0) {
            processUsers(angular.fromJson(res.rows.item(0).value)["allstudents"]);
          }
        })
      }  
    }
  }
  $scope.save = function() {
    $scope.hdata.duedate = new Date($scope.defaultDueDate).getTime();
    $rootScope.homeworks[user.uid].$add($scope.hdata);
    $state.go('app.homeworks', {uid: user.uid});
  }
})
.controller('HomeworksCtrl', function($scope, $rootScope, $state, $cordovaSQLite, Auth, $timeout, $stateParams) {
  $scope.role = user.role;
  var getLocalData = function() {
    if(db) {
      $cordovaSQLite.execute(db, "SELECT * from mydata where key = ?", ["wall"]).then(function(res) {
        $scope.loading = false;
        if(res.rows.length > 0) {
          $scope.empty = false;
          $rootScope.walls = angular.fromJson(res.rows.item(0).value);
        } else {
          $scope.empty = true;
        }
      });
    }
  }

  $scope.getHomeworks = function(refresh) {
    if(online) {
      $rootScope.homeworks[$stateParams.uid].$loaded().then(function(data) {
        if($rootScope.homeworks[$stateParams.uid].length > 0) {
          $scope.items = $rootScope.homeworks[$stateParams.uid];
          $scope.empty = false;
          Auth.saveLocal("homeworks", $rootScope.homeworks[$stateParams.uid]);
        }
        else $scope.loading = false;
      });
    } else {
      if(db) getLocalData();
      else $timeout(function() {getLocalData()}, 1000);
    }
    if(refresh) $scope.$broadcast('scroll.refreshComplete');
  }
  $scope.getHomeworks(false);
  $scope.redirect = function(item, status) {
    $state.go('app.allhwstudents', {uid:$stateParams.uid, class: item.class, id:item.$id, status:status})
  }
  $scope.ack = function(item) {
    if(!item.ack) item.ack = {};
    if(item.ack[$stateParams.uid]) {
      item.ack[$stateParams.uid] = false;
      item.done--;
      item.undone++;
      item.status = false;
    } else {
      item.ack[$stateParams.uid] = true;
      item.done++;
      item.undone--;
      item.status = true;
    }
    $rootScope.homeworks[$stateParams.uid].$save(item);
  }
})

.controller('WallCtrl', function($scope, S_ID, $rootScope, $firebaseArray, $cordovaSQLite, $state, FIREBASE_URL, $ionicModal, Auth, $ionicLoading, $ionicPopup, $timeout) {
  $scope.moredata = false;
  var getLocalData = function() {
    $cordovaSQLite.execute(db, "SELECT * from mydata where key = ?", ["wall"]).then(function(res) {
      $scope.loading = false;
      if(res.rows.length > 0) {
        $scope.empty = false;
        $scope.walls = angular.fromJson(res.rows.item(0).value);
      } else {
        $scope.empty = true;
      }
    });
  }
  $scope.loading = true;
  $scope.getWall = function(refresh) {
    if(online) {
      if(!refresh) $scope.loading = true;
      $rootScope.walls.$loaded().then(function() {
        if(!refresh) $scope.loading = false;
        Auth.saveLocal("wall", $rootScope.walls);
        $scope.$broadcast('scroll.refreshComplete');
      })
    } else {
      if(refresh) $scope.$broadcast('scroll.refreshComplete');
      if(db) getLocalData();
      else $timeout(function() {getLocalData()}, 2000);
    }
  }

  var last = 0;
  $scope.loadMoreData=function()
  {
    if(online) {
      $timeout(function() {
        if($rootScope.walls.length > last) {
          scrollRef.scroll.next(10);
          $scope.$broadcast('scroll.infiniteScrollComplete');
          last = $rootScope.walls.length;
          //if(last < 25) Auth.saveLocal("wall", $rootScope.walls);
        } else {
          $scope.moredata = true;
        }
      }, 1000)
    } else {
      $scope.moredata = true;
    }
  };
  $rootScope.$on('online', function (event, data) {
    if(data && $scope.empty) {
      $scope.getWall();
    }
  });


  $scope.uid = user.uid;
  $scope.addwall = true;

  if(user.role == 'parent') $scope.addwall = false;
  $scope.addpost = function() {
    $state.go('app.addpost', {});
  }

  $scope.like = function(wallid, action) {
    if(online) {
      var update = {};
      update.like = $rootScope.walls[wallid].like;
      update.likeuids = ($rootScope.walls[wallid].likeuids) ? $rootScope.walls[wallid].likeuids : [];
      if(action == 'like') {
        update.like++;
        update.likeuids.push(user.uid);
      } else {
        update.like--;
        var uidindex = update.likeuids.indexOf(user.uid);
        update.likeuids.splice(uidindex);
      }
      var updated = Auth.updateWall(S_ID+'/wall/'+$rootScope.walls[wallid].$id, update);
    } else {
      $ionicPopup.alert({title: 'No internet Connection',template: "Please check your internet connection"});
    }
  }

  $ionicModal.fromTemplateUrl('templates/image-modal.html', {
    scope: $scope,
    animation: 'slide-in-up'
  }).then(function(modal) {
    $scope.modal = modal;
  });

  $scope.openModal = function() {$scope.modal.show();};
  $scope.closeModal = function() {$scope.modal.hide();};
  $scope.showImage = function(index) {
    $scope.imageSrc = index;
    $scope.openModal();
  }
})

.controller('AddPostCtrl', function($scope, S_ID, $rootScope, Auth, $state, $cordovaCamera) {
  //$rootScope.walls = Auth.wall(S_ID+'/wall');
  $scope.priority = -1;
  $rootScope.walls.$loaded().then(function(data) {
    if($rootScope.walls.length > 0) {
      $scope.priority = $rootScope.walls[0].$priority - 1;
    }
  })  
  $scope.post = {};
  $scope.post.pictures = [];
  $scope.takePicture = function(type) {
    var options = {
        quality : 75,
        destinationType : Camera.DestinationType.DATA_URL,
        sourceType : Camera.PictureSourceType.CAMERA,
        encodingType: Camera.EncodingType.JPEG,
        popoverOptions: CameraPopoverOptions,
        targetWidth: 500,
        targetHeight: 500,
        saveToPhotoAlbum: false
    };
    if(type == "browse") options.sourceType = Camera.PictureSourceType.PHOTOLIBRARY;
    $cordovaCamera.getPicture(options).then(function(imageData) {
        $scope.post.pictures.push(imageData);
    }, function(error) {
        console.error(error);
    });    
  }
  $scope.viewWall = function() {
    $state.go('app.wall', {});
  }
  $scope.submit = function() {
    var uid = user.uid;
    $rootScope.walls.$add({
      'name' : user.name,
      'uid' : uid,
      'date' : Date.now(),
      'text' : $scope.post.message,
      '$priority' : $scope.priority,
      'likeuids' : [],
      'pictures' : $scope.post.pictures,
      'like' : 0
    });
    Auth.sendPush();
    $state.go('app.wall');
  }
})

.controller('MessagesCtrl', function($scope, $rootScope, $ionicLoading, $state, $cordovaSQLite, Auth, $ionicFilterBar, $timeout) {
  $scope.title = "chats";
  $scope.items = {chats:[],contacts:[]};
  var serverContacts = function() {
    Auth.getUsers().then(function(allusers) {
      if(allusers["chatcontacts"]) {
        if(user.role == "teacher") hmcontact();
        $scope.items.contacts = allusers["chatcontacts"];
      } else {$scope.items[$scope.title] = [];}
    })
  }
  var localContacts = function() {
    if(db) {
      $cordovaSQLite.execute(db, "SELECT value FROM mydata WHERE key = ?", ["allusers"]).then(function(res) {
        if(res.rows.length > 0) {
          $scope.items.contacts = angular.fromJson(res.rows.item(0).value)["chatcontacts"];
        } else {
          if(online) serverContacts();
          else $scope.items.contacts = [];
        }
      })
    } else {
      if(online) serverContacts();
      else $scope.items.contacts = [];
    }
  }
  var hmcontact = function() {
    $rootScope.hm.$loaded().then(function(hsnap) {
      for(var hh in $rootScope.hm) {
        if(hh.indexOf("simplelogin") != -1) {
          $scope.items.contacts.push({uid:hh,role:"hm",name:"Head Master",type:"single"});
        }
      }
    })
  }
  var parentContacts = function() {
    contacts = [];
    //hmcontact();
    for (var i = 0; i < user.students.length; i++) {
      for(var ss in user.students[i].subjects) {
        var stt = user.students[i].subjects[ss];
        if(stt.tid) {
          var contact = {};
          contact.uid = stt.tid;
          contact.name = stt.tname;
          contact.role = "teacher";
          contact.type = "single";
          contacts.push(contact);
        }
      }
    };
    $scope.items.contacts = contacts;
  }
  var serverChats = function() {
    $scope.chatLoading = true;
    Auth.getUserChatRooms().$ref().on('value', function(frchatrooms) {
      $scope.chatLoading = false;
      var allmess = frchatrooms.val();
      //if($scope.title = "chats") $scope.items = allmess;
      var allm = []; var ii = 0;
      angular.forEach(allmess, function(val, k) {ii++;allm.push(val);});
      if(ii > 0) $scope.chatEmpty = false;
      $scope.items.chats = allm;
      Auth.saveLocal(user.uid+"allmess", allm);
    });
  }
  var localChats = function() {
    if(db) {
      $cordovaSQLite.execute(db, "SELECT value FROM mydata WHERE key = ?", [user.uid+"allmess"]).then(function(mres) {
        if(mres.rows.length > 0) {
          $scope.items.chats = angular.fromJson(mres.rows.item(0).value);
        } else {
          $scope.items.chats = [];
        }
      });
    } else {$scope.items.chats = []};
  }
  var filterBarInstance;
  $scope.getItems = function(type) {
    $scope.title = type;
    if(type == "chats") {
      if(online) serverChats();
      else localChats();
    } else {
      if(user.role == "parent") {
        parentContacts();
      } else {
        if(online) serverContacts();    
        else localContacts();
      }
    }
  }
  $scope.showFilterBar = function () {
    filterBarInstance = $ionicFilterBar.show({
      items: $scope.items[$scope.title],
      update: function (filteredItems, filterText) {
        $scope.items[$scope.title] = filteredItems;
      }
    });
  };

  $scope.refreshItems = function (type) {
    if (filterBarInstance) {
      filterBarInstance();
      filterBarInstance = null;
    }

    $timeout(function () {
      if(type == "chats") {
        if(online) serverChats();
        else localChats();
      } else {
        if(user.role == "parent") {
          parentContacts();
        } else {      
          localContacts();
        }
      }
      $scope.$broadcast('scroll.refreshComplete');
    }, 0);
  };
  $scope.processing = {};
  $scope.$on('$ionicView.enter', function() {
    //if($rootScope.fromState == 'app.messagebox') $scope.getItems($scope.title);
  });
  $scope.toMessageBox = function(contact, action) {
      var chatroom = {};
      var fromName = user.name;
      if(user.role == "parent") {
        fromName = "Parent of ";
        for (var si = 0; si < user.students.length; si++) {
          fromName += (si == 0) ? user.students[si].name : ","+user.students[si].name;
        };
      }
      var message = {
        'from': fromName,
        'fromUid': user.uid,
        'to': contact.name,
        'toUid': contact.uid,
        'created': Date.now(),
        'type': contact.type,
      }
      var NewChat = function() {
        if(!$scope.processing[contact.uid]) {
          $scope.processing[contact.uid] = true;
          Auth.chats().$add(message).then(function(msnap) {
            var chatid = msnap.key();
            var rooms = {};
            froom = {chatid:chatid, notify:0, name: message.to, uid:message.toUid, type:message.type};
            chatrooms.$ref().child(message.fromUid).child(chatid).set(froom);
            if(message.type == "group") {
              if(db) {
                $cordovaSQLite.execute(db, "SELECT value FROM mydata WHERE key = ?", ["allusers"]).then(function(res) {
                  if(res.rows.length > 0) {
                    if(user.role != "hm") {
                      hm = {chatid:chatid, notify:0, name: message.to, uid:message.toUid, type:message.type};
                      chatrooms.$ref().child($scope.hm.uid).child(chatid).set(hm);
                    }
                    var allusers = angular.fromJson(res.rows.item(0).value);
                    for (var i = 0; i < allusers["groups"][message.toUid].length; i++) {
                      var classStudent = allusers["groups"][message.toUid][i];
                      rooms = {chatid:chatid, notify:0, name: message.to, uid:message.toUid, type:message.type};
                      chatrooms.$ref().child(classStudent.uid).child(chatid).set(rooms);
                    };
                  }
                })
              }
            } else {
              rooms = {chatid:chatid, notify:0, name: message.from, uid: message.fromUid, type:message.type};
              chatrooms.$ref().child(message.toUid).child(chatid).set(rooms);
            }
            $scope.processing[contact.uid] = false;
            $state.go('app.messagebox', {chatid:chatid, to:contact.name, toUid:contact.uid,  type:message.type, notify:0});
          })
        }
      }

      chatrooms.$ref().child(message.fromUid).orderByChild("uid").equalTo(message.toUid).once('value', function(data) {
        if(!data.val()) {
          NewChat();
        } else {
          data.forEach(function(chatval) {
            var chatid = chatval.key();
            if(chatid) {
              $state.go('app.messagebox', {chatid:chatid, toUid:message.toUid, to:message.to, type:message.type, notify:0});
            } else {
              NewChat();
            }
          })
        }
      });
    //}
  }
})
.controller('MessageBoxCtrl', function($scope, $rootScope, $state, $stateParams, $cordovaSQLite, $ionicPopup, $ionicScrollDelegate, $timeout, Auth) {
  var allchats = Auth.getAllMessages($stateParams.chatid);

  $scope.toUser = {uid:$stateParams.toUid, name:$stateParams.to};
  var fromName = user.name;
  if(user.role == "parent") {
    fromName = "Parent of ";
    for (var si = 0; si < user.students.length; si++) {
      fromName += (si == 0) ? user.students[si].name : ","+user.students[si].name;
    };
  }
  $scope.user = { uid: user.uid, name: fromName};
  $scope.input = {message: ''};

  var processMessages = function(allmsg) {
    $scope.messages = allmsg;
    $timeout(function() {
      $ionicScrollDelegate.$getByHandle('userMessageScroll').scrollBottom();
      Auth.saveLocal("chats_"+$stateParams.chatid, allmsg);
    },1000);
  }
  var getMessages = function() {
    if(online) {
      allchats.child("messages").limitToLast(50).on('value', function(frmessages) {
        if($rootScope.currentState == 'app.messagebox') {
          if($stateParams.notify > 0) {
            chatrooms.$ref().child(user.uid).child($stateParams.chatid).child("notify").set(0);
          }
          var allmm = frmessages.val() || [];
          processMessages(allmm);
        }
      })
    } else {
      if(db) {
        $cordovaSQLite.execute(db, "SELECT value from mydata WHERE key = ?", ["chats_"+$stateParams.chatid]).then(function(cres) {
          if(cres.rows.length > 0) {
            processMessages(angular.fromJson(cres.rows.item(0).value));
          }
        });
      }
    }
  }
  getMessages();
  $scope.sendMessage = function() {
    if($scope.input.message === '') return;
    var message = {
      toUid: $scope.toUser.uid,
      to: $scope.toUser.name,
      text: $scope.input.message
    };

    //keepKeyboardOpen();
    $scope.input.message = '';

    message.date = Date.now();
    message.name = fromName;
    message.userId = user.uid;
    message.type = $stateParams.type;

    allchats.child("messages").push(message);
    var roomupdate = {
      text:message.text,
      date:moment().valueOf()
    }
    if(message.type == "group") {
      var update = {};
      chatrooms.$ref().orderByChild($stateParams.chatid).once('value', function(chatdata) {
        chatdata.forEach(function(chatroomdata) {
          var ckey = chatroomdata.key();          
          var val = chatroomdata.val();
          if(user.uid != ckey) val[$stateParams.chatid].notify++;
          val[$stateParams.chatid].text = message.text;
          val[$stateParams.chatid].date = moment().valueOf();
          update[ckey] = val;
        })
        chatrooms.$ref().update(update);
      });
    } else {
      chatrooms.$ref().child(message.toUid).child($stateParams.chatid).once('value', function(data) {
        var roomdata = data.val();
        roomdata.notify++;
        roomdata.text = message.text;
        roomdata.date = moment().valueOf();
        chatrooms.$ref().child($scope.toUser.uid).child($stateParams.chatid).set(roomdata);
      })
      chatrooms.$ref().child(message.userId).child($stateParams.chatid).update(roomupdate);
    }

    $timeout(function() {
      keepKeyboardOpen();
      //$ionicScrollDelegate.$getByHandle('userMessageScroll').scrollBottom(true);
    }, 0);

  };
    
  function keepKeyboardOpen() {
    txtInput = angular.element(document.querySelector('#inputMessage'));  
    txtInput.one('blur', function() {
      txtInput[0].focus();
    });
  }
})

.controller('TimetableCtrl', function($scope, $stateParams, Auth, $timeout, $cordovaSQLite, $ionicSlideBoxDelegate) {
  var days = ["monday","tuesday","wednesday","thursday","friday","saturday"];
  $scope.next = function() {$ionicSlideBoxDelegate.next();};
  $scope.previous = function() {$ionicSlideBoxDelegate.previous();};
  $scope.slideChanged = function(index, slides) {
    $scope.slideIndex = index;
    $scope.title = days[index] + " Timetable";
  };
  $scope.title = "Timetable";
  var processData = function(daysData) {
    if(daysData.length > 0){
        $timeout(function() {
          $scope.slides = daysData;
          for(var dd in daysData[0]) {
              $scope.title = daysData[0][dd].day + " Timetable";
              break;
          }
          if(online) Auth.saveLocal("tt_"+$stateParams.id, daysData);
        },0);
    } else {
      $scope.empty = true;
    }
  }
  var timetableFromServer = function() {
    if(timetableref[$stateParams.id]) {
      var tref = timetableref[$stateParams.id];
    } else {
      var tref = Auth.getTimetable($stateParams.id);
    }
    tref.on('value', function(tdata) {
      var timetable = tdata.val() || {};
      processData(timetable);
    })
  }
  if(online) {
    timetableFromServer();
  } else {
    if(db) {
      $cordovaSQLite.execute(db, "SELECT value from mydata WHERE key = ?", ["tt_"+$stateParams.id]).then(function(tres) {
        if(tres.rows.length > 0) {
          processData(angular.fromJson(tres.rows.item(0).value));
        }
      })
    }
  }
})

.controller('FavTeacherCtrl', function ($scope, $cordovaSQLite, $stateParams, Auth, $state, $timeout, $ionicLoading, $ionicSideMenuDelegate, TDCardDelegate) {
  $scope.loadData = function() {
    $scope.selectedCard = false;
    $scope.indexItem = false;
    $ionicLoading.show();
    var cards = [];
    angular.forEach(user.students[$stateParams.id].subjects, function(subject, tk) {
      var card = {
        "uid":subject.tid,
        "name":subject.tname,
        "subject":subject.subject,
        "img": "http://res.cloudinary.com/dnzljpk6o/image/upload/v1442348003/"+subject.tid+"_med.jpg"
      }
      cards.push(card);
    });
    $timeout(function() {$ionicLoading.hide(); $scope.cards = cards;}, 100);
  }

  var selected = function(index) {
    if(index != -1) $scope.selectedCard = $scope.cards[index];
    else $scope.selectedCard = {};
    localStorage.setItem("selectedTeacher", angular.toJson($scope.selectedCard));
    $state.go('app.favteachercard', {student:$stateParams.id});
  }
  //$scope.cards = Array.prototype.slice.call(cardTypes, 0);

  $scope.cardDestroyed = function(index) {
    $scope.cards.splice(index, 1);
  };

  $scope.addCard = function() {
    var newCard = cardTypes[Math.floor(Math.random() * cardTypes.length)];
    newCard.id = Math.random();
    $scope.cards.push(angular.extend({}, newCard));
  }

  $scope.yesCard = function() {
    if(!$scope.indexItem) $scope.indexItem = $scope.cards.length - 1;
    else $scope.indexItem--;
    selected($scope.indexItem);
  };

  $scope.noCard = function() {   
    if(!$scope.indexItem) {
      $scope.indexItem = $scope.cards.length - 1;
      TDCardDelegate.$getByHandle('teachers').cardInstances[$scope.indexItem].swipe('left');
    } else {
      $scope.indexItem--;
      TDCardDelegate.$getByHandle('teachers').cardInstances[$scope.indexItem].swipe('left');
      if($scope.indexItem == 0) selected(-1);
    }
  };
  $scope.cardSwipedLeft = function(index) {
    $scope.indexItem = index;
    if(index == 0) selected(-1);
  };
  $scope.cardSwipedRight = function(index) {
    selected(index);
  };
})
.controller('FavTeacherCardCtrl', function($scope, $state, $stateParams) {
  var d = new Date();
  $scope.year = d.getFullYear();
  $scope.month = months[d.getMonth()];
  var steacher = localStorage.getItem("selectedTeacher");
  if(steacher) {
    var teacher = angular.fromJson(steacher);
    $scope.teacher = (Object.keys(teacher).length > 0) ? teacher : false;
  }
  $scope.redirect = function() {
    $state.go('app.favteacher', {id:$stateParams.student});
  }
})
.controller('CalendarCtrl', function($scope, $rootScope, $state, $ionicModal) {
  $scope.options = {
    defaultDate: moment().format("YYYY-MM-DD"),
    minDate: "2015-01-01",
    maxDate: "2016-12-31",
    dayNamesLength: 1, // 1 for "M", 2 for "Mo", 3 for "Mon"; 9 will show full day names. Default is 1.
    mondayIsFirstDay: true,//set monday as first day of week. Default is false
    eventClick: function(date) {
      $scope.item = date;
      $scope.monthevents = false;
      $scope.title = moment(date.date).format('Do MMM YYYY') +" "+ date.event[0].type;
      $scope.openModal();
    },
    dateClick: function(date) {
      //console.log("date", date);
    },
    changeMonth: function(month, year) {
      //console.log(month, year);
    },
  };
  $scope.showEvents = function(type) {
    $scope.monthevents = true;
    $scope.title = type +"s of "+ months[$rootScope.selectedMonthIndex - 1] +" "+$rootScope.selectedYearIndex;
    $scope.meventType = type;
    $scope.openModal();
  }

  $ionicModal.fromTemplateUrl('templates/calendarEvent.html', {
    scope: $scope,
    animation: 'slide-in-up'
  }).then(function(modal) {
    $scope.modal = modal;
  });

  $scope.openModal = function() {$scope.modal.show();};
  $scope.closeModal = function() {$scope.modal.hide();};
  $scope.filterData = function() {$scope.openModal();}
})
.controller('AttendanceCtrl', function($scope, $rootScope, $state, $stateParams, $ionicModal) {
  var today = moment().format("YYYY-MM-DD");
  var monthVal = school.period.split("-");
  var startRange = MONTHS[monthVal[0].toUpperCase()];
  var d = new Date();
  var year = d.getFullYear();
  if(d.getMonth() < startRange) var startdate = (year - 1) + "-" + ("0" + (startRange + 1)).slice(-2) + "-01";
  else var startdate = year + "-" + ("0" + (startRange + 1)).slice(-2) + "-01";
  $rootScope.viewAttendance[$stateParams.uid].$ref().on('value', function(asnap) {
    $scope.events = [];
    asnap.forEach(function(childsnap) {
      var val = childsnap.val();
      var key = childsnap.key();
      for(var dkey in val) {
        if(typeof val[dkey][$stateParams.uid] != 'undefined') {
          if(key < startRange) var cyear = year - 1;
          else var cyear = year;        
          if(val[dkey][$stateParams.uid]) {
            $scope.events.push({type:"present", date:cyear+"-"+key+"-"+dkey});
          } else {
            $scope.events.push({type:"absent", date:cyear+"-"+key+"-"+dkey});
          }
        }
      }
    })
  })

  $scope.options = {
    minDate: startdate,
    maxDate: today,
    dayNamesLength: 1, // 1 for "M", 2 for "Mo", 3 for "Mon"; 9 will show full day names. Default is 1.
    mondayIsFirstDay: true,//set monday as first day of week. Default is false
    eventClick: function(date) {
      //console.log("date on event click", date);
    },
    dateClick: function(date) {
      //console.log("date", date);
    },
    changeMonth: function(month, year) {
      //console.log(month, year);
    },
  };
  $scope.showEvents = function(type) {
    $scope.monthevents = true;
    $scope.title = type +"s of "+ months[$rootScope.selectedMonthIndex - 1] +" "+$rootScope.selectedYearIndex;
    $scope.meventType = type;
    $scope.openModal();
  }

  $ionicModal.fromTemplateUrl('templates/calendarEvent.html', {
    scope: $scope,
    animation: 'slide-in-up'
  }).then(function(modal) {
    $scope.modal = modal;
  });

  $scope.openModal = function() {$scope.modal.show();};
  $scope.closeModal = function() {$scope.modal.hide();};
  $scope.filterData = function() {$scope.openModal();}
})
.controller('AuthCtrl', function ($scope, $state, S_ID, $rootScope, Auth, $ionicLoading, $ionicPopup, $ionicModal) {
  if(localStorage.getItem("user")) {
    //$state.go('app.wall', {}, {reload:true});
  }
  $scope.user = {
    username: '',
    password: '',
  }
  $scope.users = [
  {
    title: 'Head Master',
    username: "8951572125hs0",
    password: 'ik1vpldi',
  },
  {
    title: 'Teacher',
    username: "9496255108ts0",
    password: "t1jlwhfr",
  },
  {
    title: "Parent",
    username: "9944711005ps0",
    password: "v8xxyldi",
  }];
  $ionicModal.fromTemplateUrl('templates/selectusers.html', {
    scope: $scope,
    animation: 'slide-in-up'
  }).then(function(modal) {
    $scope.modal = modal;
  });
  $scope.fillUser = function(modal, username, password) {
    $scope.modal.hide();
    $scope.user = {
      username: username,
      password: password
    }
    $scope.login();
  }
  $scope.showUsers = function() {
    $scope.modal.show();
  }
  $scope.login = function () {
    $ionicLoading.show({template:'<ion-spinner icon="lines" class="spinner-calm"></ion-spinner></br>Authenticating...'});

    $scope.user.email = $scope.user.username + "@ge.com";
    Auth.login($scope.user).then(function (user) {
      $ionicLoading.hide();
      $state.go('app.wall', {}, {reload: true});
    }, function (error) {
      $ionicLoading.hide();
      var msg = error;
      switch (error.code) {
        case "INVALID_EMAIL":
          msg = "The specified user account email is invalid.";
          break;
        case "INVALID_PASSWORD":
          msg = "The specified user account password is incorrect.";
          break;
        case "INVALID_USER":
          msg = "The specified user account does not exist.";
          break;
        default:
          msg = "Error logging user in:";
      }
      $ionicPopup.alert({title: 'Login Failed',template: msg});
    })
  };
})

.controller('AccountCtrl', function($scope, $ionicActionSheet, $cordovaCamera, $timeout, Auth) {
  $scope.user = user;
  $scope.show = function() {
    // Show the action sheet
    var hideSheet = $ionicActionSheet.show({
     buttons: [
       { text: '<i class="icon ion-image positive"></i> Gallery ' },
       { text: '<i class="icon ion-camera positive"></i>  Camera ' }
     ],
     titleText: 'Change Profile Picture',
     cancelText: 'Cancel',
     cancel: function() {
          // add cancel code..
        },
     buttonClicked: function(index) {
        console.log("index", index);
        $timeout(function() { hideSheet();}, 0);

        var options = {
          quality : 75,
          destinationType : Camera.DestinationType.DATA_URL,
          sourceType : Camera.PictureSourceType.PHOTOLIBRARY,
          encodingType: Camera.EncodingType.JPEG,
          popoverOptions: CameraPopoverOptions,
          targetWidth: 150,
          targetHeight: 150,
          allowEdit: true,
          saveToPhotoAlbum: false
        };
        if(index == 1) options.sourceType = Camera.PictureSourceType.CAMERA;
        $cordovaCamera.getPicture(options).then(function(imageData) {
          Auth.updateProfilePic(user.uid, imageData);
        }, function(error) {
          console.error(error);
        });
      }
    });
  };
})
.controller('KidCtrl', function($scope, $stateParams, $ionicActionSheet, $cordovaCamera, $timeout, Auth) {
  $scope.kid = user.students[$stateParams.key];
  $scope.show = function() {
    // Show the action sheet
    var hideSheet = $ionicActionSheet.show({
     buttons: [
       { text: '<i class="icon ion-image positive"></i> Gallery ' },
       { text: '<i class="icon ion-camera positive"></i>  Camera ' }
     ],
     titleText: 'Change Profile Picture',
     cancelText: 'Cancel',
     cancel: function() {
          // add cancel code..
        },
     buttonClicked: function(index) {
        console.log("index", index);
        $timeout(function() { hideSheet();}, 0);

        var options = {
          quality : 75,
          destinationType : Camera.DestinationType.DATA_URL,
          sourceType : Camera.PictureSourceType.PHOTOLIBRARY,
          encodingType: Camera.EncodingType.JPEG,
          popoverOptions: CameraPopoverOptions,
          targetWidth: 150,
          targetHeight: 150,
          allowEdit: true,
          saveToPhotoAlbum: false
        };
        if(index == 1) options.sourceType = Camera.PictureSourceType.CAMERA;
        $cordovaCamera.getPicture(options).then(function(imageData) {
          Auth.updateProfilePic($stateParams.uid, imageData);
        }, function(error) {
          console.error(error);
        });
      }
    });
  };
})

.controller('BusTrackingCtrl', function($scope, $ionicLoading, S_ID) {
 // Set the center as Firebase HQ
  var locations = {
    "FirebaseHQ": [12.917147, 77.622798],
    "Caltrain": [37.7789, -122.3917]
  };
  var center = locations["FirebaseHQ"];

  // Query radius
  var radiusInKm = 5;

  // Get a reference to the Firebase public transit open data set
  var transitFirebaseRef = ref.child('tracking/'+S_ID);

  // Create a new GeoFire instance, pulling data from the public transit data
  var geoFire = new GeoFire(transitFirebaseRef.child("_geofire"));

  /*************/
  /*  GEOQUERY */
  /*************/
  // Keep track of all of the vehicles currently within the query
  var vehiclesInQuery = {};
  // Create a new GeoQuery instance
  var geoQuery = geoFire.query({
    center: center,
    radius: radiusInKm
  });

  $scope.mapCreated = function(map) {
    $scope.map = map;
    // Create a draggable circle centered on the map
    var circle = new google.maps.Circle({
      strokeColor: "#6D3099",
      strokeOpacity: 0.7,
      strokeWeight: 0,
      fillColor: "#B650FF",
      fillOpacity: 0,
      map: map,
      center: new google.maps.LatLng(user.students[0].lat, user.students[0].lng),
      radius: ((5) * 1000),
      draggable: true
    });
    //Update the query's criteria every time the circle is dragged
    var updateCriteria = _.debounce(function() {
      var latLng = circle.getCenter();
      geoQuery.updateCriteria({
        center: [latLng.lat(), latLng.lng()],
        radius: radiusInKm
      });
    }, 10);
    google.maps.event.addListener(circle, "drag", updateCriteria);
    //create route
    var rendererOptions = {
      map: map,
      suppressMarkers : true
    }
    var directionsDisplay = new google.maps.DirectionsRenderer(rendererOptions);
    var directionsService = new google.maps.DirectionsService();
    var start = new google.maps.LatLng(12.921354, 77.620125);
    //var end = new google.maps.LatLng(38.334818, -181.884886);
    var end = new google.maps.LatLng(12.928778, 77.615662);
    var request = {
      origin: start,
      destination: end,
      travelMode: google.maps.TravelMode.DRIVING
    };
    directionsService.route(request, function(response, status) {
      if (status == google.maps.DirectionsStatus.OK) {
        var myRoute = response.routes[0].legs[0];
        var startMarker = new google.maps.Marker({
          position: myRoute.steps[0].start_point, 
          map: map,
          icon: "img/flag.png"
        });
        var endMarker = new google.maps.Marker({
          position: myRoute.steps[myRoute.steps.length - 1].end_point, 
          map: map,
          icon: "img/school.png"
        });
        directionsDisplay.setDirections(response);
        directionsDisplay.setMap(map);
      } else {
        alert("Directions Request from " + start.toUrlValue(6) + " to " + end.toUrlValue(6) + " failed: " + status);
      }
    });
    var currentLocationMarker = createStudentMarker(user.students[0].lat, user.students[0].lng);
    /* Adds new vehicle markers to the map when they enter the query */
    geoQuery.on("key_entered", function(vehicleId, vehicleLocation) {
      // Specify that the vehicle has entered this query
      vehicleId = vehicleId.split(":")[1];
      vehiclesInQuery[vehicleId] = true;

      // Look up the vehicle's data in the Transit Open Data Set
      transitFirebaseRef.child("vehicles").child(vehicleId).once("value", function(dataSnapshot) {
        // Get the vehicle data from the Open Data Set
        vehicle = dataSnapshot.val();
        // If the vehicle has not already exited this query in the time it took to look up its data in the Open Data
        // Set, add it to the map
        if (vehicle !== null && vehiclesInQuery[vehicleId] === true) {
          // Add the vehicle to the list of vehicles in the query
          vehiclesInQuery[vehicleId] = vehicle;
          // Create a new marker for the vehicle
          vehicle.marker = createVehicleMarker(vehicleLocation[0], vehicleLocation[1], vehicle);
        }
      });
    });

    /* Moves vehicles markers on the map when their location within the query changes */
    geoQuery.on("key_moved", function(vehicleId, vehicleLocation) {
      // Get the vehicle from the list of vehicles in the query
      vehicleId = vehicleId.split(":")[1];
      var vehicle = vehiclesInQuery[vehicleId];

      // Animate the vehicle's marker
      if (typeof vehicle !== "undefined" && typeof vehicle.marker !== "undefined") {
        vehicle.marker.animatedMoveTo(vehicleLocation);
      }
    });

    /* Removes vehicle markers from the map when they exit the query */
    geoQuery.on("key_exited", function(vehicleId, vehicleLocation) {
      // Get the vehicle from the list of vehicles in the query
      vehicleId = vehicleId.split(":")[1];
      var vehicle = vehiclesInQuery[vehicleId];

      // If the vehicle's data has already been loaded from the Open Data Set, remove its marker from the map
      if (vehicle !== true) {
        vehicle.marker.setMap(null);
      }

      // Remove the vehicle from the list of vehicles in the query
      delete vehiclesInQuery[vehicleId];
    });

    /*****************/
    /*  GOOGLE MAPS  */
    /*****************/
    /* Initializes Google Maps */
    // function initializeMap() {

    // }
    // initializeMap();
    /**********************/
    /*  HELPER FUNCTIONS  */
    /**********************/
    /* Adds a marker for the inputted vehicle to the map */
    function createVehicleMarker(latitude, longitude, vehicle) {
      var marker = new google.maps.Marker({
        icon: "img/bus.png",
        //icon: "https://lh4.googleusercontent.com/-UjKiveTyTUI/VKJ3RyUC0LI/AAAAAAAAAGc/zxBS9koEx6c/w800-h800/nnkjn.png&chld=" + vehicle.vtype + "|bbT|" + vehicle.routeTag + "|" + vehicleColor + "|eee",
        position: new google.maps.LatLng(latitude, longitude),
        optimized: true,
        map: map
      });

      return marker;
    }

    function createStudentMarker(latitude, longitude) {
      var marker = new google.maps.Marker({
        zIndex: 10,
        icon: "img/kids.png",
        position: new google.maps.LatLng(latitude, longitude),
        optimized: true,
        map: map
      });

      return marker;
    }
    /* Returns a blue color code for outbound vehicles or a red color code for inbound vehicles */
    function getVehicleColor(vehicle) {
      return ((vehicle.dirTag && vehicle.dirTag.indexOf("OB") > -1) ? "50B1FF" : "FF6450");
    }

    /* Returns true if the two inputted coordinates are approximately equivalent */
    function coordinatesAreEquivalent(coord1, coord2) {
      return (Math.abs(coord1 - coord2) < 0.000001);
    }

    /* Animates the Marker class (based on https://stackoverflow.com/a/10906464) */
    google.maps.Marker.prototype.animatedMoveTo = function(newLocation) {
      var toLat = newLocation[0];
      var toLng = newLocation[1];

      var fromLat = this.getPosition().lat();
      var fromLng = this.getPosition().lng();

      if (!coordinatesAreEquivalent(fromLat, toLat) || !coordinatesAreEquivalent(fromLng, toLng)) {
        var percent = 0;
        var latDistance = toLat - fromLat;
        var lngDistance = toLng - fromLng;
        var interval = window.setInterval(function () {
          percent += 0.01;
          var curLat = fromLat + (percent * latDistance);
          var curLng = fromLng + (percent * lngDistance);
          var pos = new google.maps.LatLng(curLat, curLng);
          this.setPosition(pos);
          if (percent >= 1) {
            window.clearInterval(interval);
          }
        }.bind(this), 50);
      }
    };
  };

})
// fitlers
.filter('nl2br', ['$filter',
  function($filter) {
    return function(data) {
      if (!data) return data;
      return data.replace(/\n\r?/g, '<br />');
    };
  }
])
// configure moment relative time
moment.locale('en', {
  relativeTime: {
    future: "in %s",
    past: "%s ago",
    s: "%d sec",
    m: "a min",
    mm: "%d min",
    h: "hr",
    hh: "%d hrs",
    d: "day",
    dd: "%d days",
    M: "mon",
    MM: "%d months",
    y: "a year",
    yy: "%d years"
  }
});

angular.module('monospaced.elastic', [])

  .constant('msdElasticConfig', {
    append: ''
  })

  .directive('msdElastic', [
    '$timeout', '$window', 'msdElasticConfig',
    function($timeout, $window, config) {
      'use strict';

      return {
        require: 'ngModel',
        restrict: 'A, C',
        link: function(scope, element, attrs, ngModel) {

          // cache a reference to the DOM element
          var ta = element[0],
              $ta = element;

          // ensure the element is a textarea, and browser is capable
          if (ta.nodeName !== 'TEXTAREA' || !$window.getComputedStyle) {
            return;
          }

          // set these properties before measuring dimensions
          $ta.css({
            'overflow': 'hidden',
            'overflow-y': 'hidden',
            'word-wrap': 'break-word'
          });

          // force text reflow
          var text = ta.value;
          ta.value = '';
          ta.value = text;

          var append = attrs.msdElastic ? attrs.msdElastic.replace(/\\n/g, '\n') : config.append,
              $win = angular.element($window),
              mirrorInitStyle = 'position: absolute; top: -999px; right: auto; bottom: auto;' +
                                'left: 0; overflow: hidden; -webkit-box-sizing: content-box;' +
                                '-moz-box-sizing: content-box; box-sizing: content-box;' +
                                'min-height: 0 !important; height: 0 !important; padding: 0;' +
                                'word-wrap: break-word; border: 0;',
              $mirror = angular.element('<textarea tabindex="-1" ' +
                                        'style="' + mirrorInitStyle + '"/>').data('elastic', true),
              mirror = $mirror[0],
              taStyle = getComputedStyle(ta),
              resize = taStyle.getPropertyValue('resize'),
              borderBox = taStyle.getPropertyValue('box-sizing') === 'border-box' ||
                          taStyle.getPropertyValue('-moz-box-sizing') === 'border-box' ||
                          taStyle.getPropertyValue('-webkit-box-sizing') === 'border-box',
              boxOuter = !borderBox ? {width: 0, height: 0} : {
                            width:  parseInt(taStyle.getPropertyValue('border-right-width'), 10) +
                                    parseInt(taStyle.getPropertyValue('padding-right'), 10) +
                                    parseInt(taStyle.getPropertyValue('padding-left'), 10) +
                                    parseInt(taStyle.getPropertyValue('border-left-width'), 10),
                            height: parseInt(taStyle.getPropertyValue('border-top-width'), 10) +
                                    parseInt(taStyle.getPropertyValue('padding-top'), 10) +
                                    parseInt(taStyle.getPropertyValue('padding-bottom'), 10) +
                                    parseInt(taStyle.getPropertyValue('border-bottom-width'), 10)
                          },
              minHeightValue = parseInt(taStyle.getPropertyValue('min-height'), 10),
              heightValue = parseInt(taStyle.getPropertyValue('height'), 10),
              minHeight = Math.max(minHeightValue, heightValue) - boxOuter.height,
              maxHeight = parseInt(taStyle.getPropertyValue('max-height'), 10),
              mirrored,
              active,
              copyStyle = ['font-family',
                           'font-size',
                           'font-weight',
                           'font-style',
                           'letter-spacing',
                           'line-height',
                           'text-transform',
                           'word-spacing',
                           'text-indent'];

          // exit if elastic already applied (or is the mirror element)
          if ($ta.data('elastic')) {
            return;
          }

          // Opera returns max-height of -1 if not set
          maxHeight = maxHeight && maxHeight > 0 ? maxHeight : 9e4;

          // append mirror to the DOM
          if (mirror.parentNode !== document.body) {
            angular.element(document.body).append(mirror);
          }

          // set resize and apply elastic
          $ta.css({
            'resize': (resize === 'none' || resize === 'vertical') ? 'none' : 'horizontal'
          }).data('elastic', true);

          /*
           * methods
           */

          function initMirror() {
            var mirrorStyle = mirrorInitStyle;

            mirrored = ta;
            // copy the essential styles from the textarea to the mirror
            taStyle = getComputedStyle(ta);
            angular.forEach(copyStyle, function(val) {
              mirrorStyle += val + ':' + taStyle.getPropertyValue(val) + ';';
            });
            mirror.setAttribute('style', mirrorStyle);
          }

          function adjust() {
            var taHeight,
                taComputedStyleWidth,
                mirrorHeight,
                width,
                overflow;

            if (mirrored !== ta) {
              initMirror();
            }

            // active flag prevents actions in function from calling adjust again
            if (!active) {
              active = true;

              mirror.value = ta.value + append; // optional whitespace to improve animation
              mirror.style.overflowY = ta.style.overflowY;

              taHeight = ta.style.height === '' ? 'auto' : parseInt(ta.style.height, 10);

              taComputedStyleWidth = getComputedStyle(ta).getPropertyValue('width');

              // ensure getComputedStyle has returned a readable 'used value' pixel width
              if (taComputedStyleWidth.substr(taComputedStyleWidth.length - 2, 2) === 'px') {
                // update mirror width in case the textarea width has changed
                width = parseInt(taComputedStyleWidth, 10) - boxOuter.width;
                mirror.style.width = width + 'px';
              }

              mirrorHeight = mirror.scrollHeight;

              if (mirrorHeight > maxHeight) {
                mirrorHeight = maxHeight;
                overflow = 'scroll';
              } else if (mirrorHeight < minHeight) {
                mirrorHeight = minHeight;
              }
              mirrorHeight += boxOuter.height;
              ta.style.overflowY = overflow || 'hidden';

              if (taHeight !== mirrorHeight) {
                ta.style.height = mirrorHeight + 'px';
                scope.$emit('elastic:resize', $ta);
              }
              
              scope.$emit('taResize', $ta); // listen to this in the UserMessagesCtrl

              // small delay to prevent an infinite loop
              $timeout(function() {
                active = false;
              }, 1);

            }
          }

          function forceAdjust() {
            active = false;
            adjust();
          }

          /*
           * initialise
           */

          // listen
          if ('onpropertychange' in ta && 'oninput' in ta) {
            // IE9
            ta['oninput'] = ta.onkeyup = adjust;
          } else {
            ta['oninput'] = adjust;
          }

          $win.bind('resize', forceAdjust);

          scope.$watch(function() {
            return ngModel.$modelValue;
          }, function(newValue) {
            forceAdjust();
          });

          scope.$on('elastic:adjust', function() {
            initMirror();
            forceAdjust();
          });

          $timeout(adjust);

          /*
           * destroy
           */

          scope.$on('$destroy', function() {
            $mirror.remove();
            $win.unbind('resize', forceAdjust);
          });
        }
      };
    }
  ]);