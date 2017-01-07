var mongoose=require('mongoose');
mongoose.connect('mongodb://user:Azerty123@ds151228.mlab.com:51228/projecten2');
//mongoose.connect('mongodb://localhost:27017/Projecten2');
var fs = require('fs');
var readline =require('readline');
var async = require('async');

//functionblocks
var rest= require('./functions/rest');
var crypt = require('./functions/encrypt');

//models
var Player = require('./models/player');
var User = require('./models/user');
/*
var rl= readline.createInterface({
    input:fs.createReadStream('battletags.txt')
});
var line = "Na5cA#2343";
var queue = async.queue(function (line,callback) {
    addPlayer(line,callback);
},30) ;
rl.on('line',function (line) {
    queue.push(line);
});
*/
Player.find(function(err,players){
    if(err) throw err;
    var queue=async.queue(function(player,callback){
        var heroesoptions = {
            host: "api.lootbox.eu",
            port: 443,
            path: "/pc/eu/" + player.username + "/competitive/heroes",
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        };

        rest.getJSON(heroesoptions, function (statusCode, result) {
            console.log('getheroes');
            console.log(statusCode);
            console.log(result);
            if (!result.statuscode) {
                Player.findOneAndUpdate({username: player.username}, {heroes: result}, function (err) {
                    if (err) throw err;
                    console.log("gotheroes");
                    callback();
                },30);
            }
        });
    });
    players.forEach(function (player) {
        queue.push(player);
    })
});

Player.find(function(err,players){
    if(err) throw err;
    var queue=async.queue(function(player,callback){
        //get global stats
        var statoptions = {
            host: "api.lootbox.eu",
            port: 443,
            path: "/pc/eu/" + player.username + "/competitive/allHeroes/",
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        };
        console.log('getstats');

        rest.getJSON(statoptions, function (statusCode, result) {
            console.log('getstats');
            console.log(result);
            Player.findOneAndUpdate({username: player.username}, {stats: JSON.stringify(result)}, function (err) {
                if (err) throw err;
                console.log('got stats');
                callback();
            });
        });
    });
    players.forEach(function (player) {
        queue.push(player);
    })
});
/*
 *============================================
 *   Middleware
 *============================================
 */
function checkInput(input){
    var re = new RegExp("^[A-Za-z0-9_-]+$");
    if (!re.test(input)) {
        console.log('user ' +  input + ' skipped');
        return false;
    }
    return true;
}

function addPlayer(line,callback){
    var tag = line.replace("#", "-");
    if(checkInput(tag)) {
        var options = {
            host: "api.lootbox.eu",
            port: 443,
            path: "/pc/eu/" + tag + "/Profile",
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        };
        //get Profile info
        rest.getJSON(options, function (statusCode, result) {
            console.log(statusCode);
            if (!result.statusCode) {
                var data = result.data;
                console.log(tag);
                var player = new Player({
                    username: tag,
                    level: data.level,
                    games: {
                        quick: {
                            wins: data.games.quick.wins
                        },
                        competitive: {
                            wins: data.games.competitive.wins,
                            lost: data.games.competitive.lost,
                            played: data.games.competitive.played
                        }
                    },
                    playtime: {
                        quick: data.playtime.quick,
                        competitive: data.playtime.competitive
                    },
                    avatar: data.avatar,
                    competitive: {
                        rank: data.competitive.rank,
                        rank_img: data.competitive.rank_img
                    },
                    levelFrame: data.levelFrame,
                    star: data.star,
                    heroes: [],
                    stats: ""
                });
                player.save(function (err) {
                    if(err)throw err;
                });
                console.log("player saved");

                    callback();
            }
            else callback();

        });
    }
    else callback();
}
