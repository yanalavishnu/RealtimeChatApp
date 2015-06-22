var express = require("express"),
    path = require("path"),
    config = require("config"),
    _ = require("lodash"),
    redis = require("redis"),
    bodyParser = require("body-parser"),
    cookieParser = require("cookie-parser"),
    ejs = require("ejs"),
    mongoose = require("mongoose"),
    redis = require("redis");

var app = express();
app.use(cookieParser());
app.use(bodyParser.json());

app.use(function(req,res,next){
    var redisPublishClient = redis.createClient(config.redis.port,config.redis.host,{auth_pass:config.redis.pass});
    redisPublishClient.on("error",function(err){
        console.log(err);
    });
    res.publish= function(channel,to,message){
        message.to=to;
        redisPublishClient.publish(channel,JSON.stringify(message));
    };
    next();
});


var db = mongoose.connection;

db.once("error",function(err){
    console.error("mongoose connection error"+err);
});
db.on("open",function(){
    console.log("successfully connected to mongoose");
});

mongoose.connect(config.mongodb.uri);

app.use(express.static(path.join(__dirname+"/..","public")));
app.engine("html",ejs.renderFile);
app.set("view engine","html");


var server = app.listen(config.port,function(){
        console.log("HTTP Server started at port "+config.port);
    }),
    io = require("socket.io").listen(server),
    redisClient = redis.createClient(config.redis.port, config.redis.host, {auth_pass: config.redis.pass}),
    ioUsers={},
    ioClients={};

io.sockets.on("connection",function(socket){
    ioClients[socket.client.id]=socket;
    var name = "default";
    socket.on("register",function(data){
        name = data.name;
        socket.join(data.channel);
        ioUsers[name] = (typeof ioUsers[name]!= 'undefined' && ioUsers[name] instanceof Array)?ioUsers[name]:[];
        ioUsers[name].push(socket.client.id);
        _.forEach(ioClients,function(id){
            id.emit("onlineUsers",Object.keys(ioUsers));
            if(ioUsers[name].length==1)
                id.emit("message",{"from":name,"text":name+" is online",online:true});
        });
    });
    socket.on("typing",function(data){
        _.forEach(ioUsers[data.to],function(id){
            if(ioClients[id]){
                ioClients[id].emit("isTyping",{"person":data.name});
            }
        });
    });
    socket.on("disconnect",function(data){
        delete ioClients[socket.client.id];
        if(ioUsers[name]) {
            var x = ioUsers[name].indexOf(socket.client.id);
            if (x != -1) {
                ioUsers[name].splice(x, 1);
            }
            if (typeof ioUsers[name] !== 'undefined' && ioUsers[name].length == 0) {
                delete ioUsers[name];
                _.forEach(ioClients,function(id) {
                    id.emit("message", {"from": name, "text": name + " is offline", offline: true});
                });
            }
            _.forEach(ioClients,function(id){
                id.emit("onlineUsers",Object.keys(ioUsers));
            });
        }
    })
});

redisClient.once("error",function(err){
    console.log("problem while connecting to redis");
    console.log(err);
});
redisClient.on("ready",function(){
    console.log("successfully connected to redis");
    redisClient.subscribe("messages");
});

redisClient.on("message",function(channel,message){
    var msg = JSON.parse(message);
    if(msg.to && ioUsers[msg.to] && channel==="messages"){
        var resp = JSON.parse(message);
        resp.to = undefined;
        _.forEach(ioUsers[msg.to],function(id){
            if(ioClients[id]){
                ioClients[id].emit("message",resp);
            }
        });
    }
    if(msg.from && ioUsers[msg.from] && channel==="messages"){
        var resp = JSON.parse(message);
        resp.to = undefined;
        _.forEach(ioUsers[msg.from],function(id){
            if(ioClients[id]){
                ioClients[id].emit("message",resp);
            }
        });
    }
});

require("../routes/routes")(app);
