
angular.module("chatApp").controller("messageCtrl",function($scope,$rootScope,socket,$routeParams,$location,$http,$cookies,$timeout){
    $scope.$on('$routeChangeStart', function() {
        socket.getSocket().removeAllListeners();
    });
    $scope.notifications=[];
    $scope.userName = $routeParams.user;
    $scope.users=socket.users;
    $scope.messages=[];
    $scope.badges=socket.badges;
    $scope.notification="";
    if($scope.badges && $scope.badges[$routeParams.user])
        $scope.badges[$routeParams.user]=0;
    $scope.$on('$routeChangeStart', function(next, current) {
        socket.badges = $scope.badges;
        socket.users = $scope.users;
    });
    $http.get('/'+$cookies.user+'/message/'+$routeParams.user)
        .success(function(data){
            $scope.messages=data;
            scroll();
        })
        .error(function(data){
            console.log(data);
        });
    $scope.go = function(location){
        $location.path(location);
    };
    socket.on("connect",function(data){
        socket.emit("register",{"name":$cookies.user,"channel":"messages"})
    });
    socket.on("message",function(data){
        if(data.from==$routeParams.user || data.from == $cookies.user ) {
            $scope.messages.push(data);
            scroll();
        }
        else{

            $scope.badges[data.from]+=1;
            $scope.notification= data;
            $("#notification").fadeIn(0);
            $timeout(function(){
                $("#notification").fadeOut(500);
            },4000);
        }
    });
    socket.on("onlineUsers",function(data){
        $scope.users = data;
        $scope.users.splice($scope.users.indexOf($cookies.user),1);
        angular.forEach($scope.users, function( key) {
            $scope.badges[key]=0;
        });
    });
    $scope.change=function(){
        if($routeParams.user)
            socket.emit("typing",{"name":$cookies.user,"to":$routeParams.user})
    };
    socket.on("isTyping",function(data){
        console.log(data.person+" is typing!");
    });
    function scroll(){
        var chatBody =$(".chatBody");
        chatBody.stop().animate({
            scrollTop: chatBody[0].scrollHeight
        },500);
    }

    $scope.send=function(){
        if($routeParams.user){
            $http.post('/message/'+$routeParams.user,{text:$scope.text,from:$cookies.user,to:$routeParams.user,"text":$scope.message})
                .success(function(data){
                    $scope.message="";
                })
                .error(function(data){
                    console.log(data);
                });
        }
        else{
            alert("select a user");
        }
    };
});
