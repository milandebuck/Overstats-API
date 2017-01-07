/**
 * Created by milan on 01.11.16.
 */
var mongoose = require('mongoose');
var Schema=mongoose.Schema;

var UserSchema = new Schema({
    username: String,
    password: String,
    editrights: Boolean
});

module.exports = mongoose.model('User',UserSchema);
