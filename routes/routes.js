var mongoose = require("mongoose"),
    Message = require("../models/message"),
    ffmpeg = require("ffmpeg"),
    fs = require('fs');

module.exports = function(app){
    app.route("/test")
        .get(function (req,res) {
            res.publish("messages","raghu",{"text":"hai"});
            res.send("OK");
        });
    app.route("/message/:user")
        .post(function(req,res){
            var message = new Message(req.body);
            message.save(function(err,result){
                if(err) {
                    console.log(err);
                    res.status(500).send(err);
                }
                else {
                    res.publish("messages",req.params.user,result);
                    res.status(200).send(result);
                }
            });
        });
    app.route("/:user/message/:user1")
        .get(function(req,res){
            Message.find({$or:[{"from":req.params.user , "to":req.params.user1},{"to":req.params.user , "from":req.params.user1}]},function(err,result){
                if(err) {
                    console.log(err);
                    res.status(500).send(err);
                }
                else
                    res.status(200).send(result);
            })
        });
    
    app.route("/*")
        .get(function(req,res){
            res.render('index');
        })
};
