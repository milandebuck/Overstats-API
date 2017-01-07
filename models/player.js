/**
 * Created by milan on 01.11.16.
 */
var mongoose = require('mongoose');
var Schema=mongoose.Schema;

var PlayerSchema = new Schema({
    username: String,
    level: Number,
    games: {
        quick: {
            wins: Number
        },
        competitive: {
            wins: Number,
            lost: Number,
            played: Number
        }
    },
    playtime: {
        quick: String,
        competitive: String
    },
    avatar: String,
    competitive: {
        rank: Number,
        rank_img: String
    },
    levelFrame: String,
    star: String,
    heroes:  Array,
    stats: String
});

module.exports = mongoose.model('Player',PlayerSchema);