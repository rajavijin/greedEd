angular.module('starter.services', [])

.factory('myCache', function($cacheFactory) {
  return $cacheFactory('myCache');
})

.factory('MyService', function() {
  user.id
  // Might use a resource here that returns a JSON array
  var menus = {
    "hmMenu": {"Links":[{"title":"Dashboard", "href":"/app/hmdashboard", "class":"ion-stats-bars"},{"title":"Classes", "href":"/app/allclasses", "class": "ion-easel"},{"title":"Students", "href":"/app/allstudents", "class": "ion-person-stalker"},{"title":"Teachers", "href":"/app/allteachers", "class": "ion-ios-body"},{"title":"Wall","href":"/app/wall","class":"ion-ios-list"},{"title":"Messages", "href":"/app/messages", "class":"ion-chatboxes"}]},
    //"parentMenu": {"Links":[{"title":"Children", "href":"/app/allstudents", "class": "ion-person-stalker"},{"title":"Wall","href":"/app/wall","class":"ion-ios-list"},{"title":"log-out", "href":"logout", "class":"ion-log-out"}]},
    "parentSingleMenu": {"Links":[{"title":"Dashboard", "href":"/app/studentdashboard", "class":"ion-stats-bars"},{"title":"Overall Dashboard", "href":"/app/studentoveralldashboard", "class":"ion-ios-pulse-strong"},{"title":"Class Dashboard", "href":"/app/dashboard", "class":"ion-pie-graph"},{"title":"Wall","href":"/app/wall","class":"ion-ios-list"},{"title":"Messages", "href":"/app/messages", "class":"ion-chatboxes"},{"title":"TimeTable", "href":"/app/timetable", "class":"ion-ios-time-outline"}]},
    "teacherMenu": {"Links":[{"title":"Dashboard", "href":"/app/teacherdashboard", "class":"ion-stats-bars"},{"title":"Students", "href":"/app/allstudents", "class": "ion-person-stalker"},{"title":"Wall","href":"/app/wall","class":"ion-ios-list"},{"title":"Messages", "href":"/app/messages", "class":"ion-chatboxes"}]},
    "classTeacherMenu": {"Links":[{"title":"Class Dashboard", "href":"/app/dashboard", "class":"ion-stats-bars"},{"title":"Teacher Dashboard", "href":"/app/teacherdashboard", "class":"ion-ios-pulse-strong"},{"title":"Students", "href":"/app/allstudents", "class": "ion-person-stalker"},{"title":"Messages", "href":"/app/messages", "class":"ion-chatboxes"},{"title":"Profile", "href":"/app/teacherprofile", "class": "ion-person"},{"title":"Wall","href":"/app/wall","class":"ion-ios-list"}]},
  }
  
  return {
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
    }
  }
});