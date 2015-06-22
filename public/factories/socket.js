angular.module("chatApp").factory('socket',function($rootScope,$location){
    var socket = io.connect("ws://"+$location.host()+":"+$location.port());
    console.log("ws://"+$location.host()+":"+$location.port());
    return{
        users:[],
        badges:[],
        on:function(eventName,callback){
            socket.on(eventName,function(){
                var args = arguments;
                $rootScope.$apply(function(){
                    callback.apply(socket,args);
                })
            });
        },
        emit:function(eventName,data,callback){
            socket.emit(eventName,data,function(){
                var args = arguments;
                $rootScope.$apply(function(){
                    if(callback)
                        callback.apply(socket,args);
                })
            });
        },
        getSocket: function() {
            return socket;
        }
    }
});
