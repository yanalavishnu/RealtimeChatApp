angular.module("chatApp").controller("homeCtrl",function($scope,$location,$cookies){
    $scope.start = function(){
        if($scope.user != ""){
            $cookies.user = $scope.user;
            $location.path("/message/");
        }
    };
});
