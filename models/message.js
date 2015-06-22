var mongoose = require("mongoose"),
    Schema = mongoose.Schema,
    validator = require("mongoose-unique-validator");

var messageSchema = new Schema({
    from:{
        type:String,
        required:true
    },
    to:{
        type:String,
        required:true
    },
    text:{
        type:String,
        required:true
    },
    time:{
        type:Date,
        default:Date.now()
    }
});

messageSchema.plugin(validator);

module.exports = mongoose.model("Message",messageSchema);
