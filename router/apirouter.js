var express = require('express');
var router = express.Router();
var fs = require('fs');
var readline =require('readline');
var async = require('async');
var jwt = require('jsonwebtoken');

//functionblocks
var rest= require('../functions/rest');
var crypt = require('../functions/encrypt');

//models
var Player = require('../models/player');
var User = require('../models/user');

var createAPI =function(app) {


    /*
     *============================================
     *   Routes
     *============================================
     */
//base route
    router.get('/', function (req, res) {
        res.send('hello this is the Overstats api');
    });
    /*
     *============================================
     *   Overall Routes
     *============================================
     */
//register
    router.post('/Register', function (req, res) {
        User.findOne({username: req.body.username}, function (err, user) {
            if (err)throw err;
            if (!user) {
                crypt.cryptPassword(req.body.password,function (err,hash) {
                    if(err) throw err;
                    var user=User({
                        username: req.body.username,
                        password: hash,
                        editrights: false
                    }) ;

                    user.save(function (err) {
                        if(err)throw err;
                        res.json({succes:true, msg:'user created enjoy the api'});
                    })
                });
            } else res.json({succes: false, msg: 'user already exists'});

        });
    });
//authentication
    router.post('/Authenticate', function (req, res) {
        User.findOne({username: req.body.username}, function (err, user) {
            if (err)throw err;
            if (user) {
                crypt.comparePassword(req.body.password, user.password, function (err, match) {
                    if (!match) res.json({succes: false, msg: 'incorrect password'});
                    else {
                        var token = jwt.sign(user, app.get('secret'),{ expiresIn: 60*60*24});
                        res.json({
                            succes: true,
                            msg: "Authenticaed enjoy the api",
                            token: token
                        });
                    }
                })
            } else res.json({succes: false, msg: 'no user found with that username'});

        });
    });
    /*
     *============================================
     *   Route Authentication middleware
     *============================================
     */
    router.use(function (req, res, next) {
        var token = req.body.token || req.query.token || req.headers['x-access-token'];

        if (token) {
            jwt.verify(token, app.get('secret'), function (err, decoded) {
                if (err) return res.json({succes: false, msg: 'failed to authenticate' + err});
                req.decoded = decoded;
                next();
            })
        }
        else return res.status(403).send({succes: false, msg: 'no token found'});
    });
    /*
     *============================================
     *   API Routes
     *============================================
     */
//get all playername
    router.get('/Players/All', function (req, res) {
        Player.find({}, function (err, result) {
         if (err) {
            res.status(503).send('oops apparantly we have no users :(');
         }
         else{
            console.log(result);
            var names = [];
            result.map(function(name) {
                console.log("adding player" + name.username);
                var user = {
                    username: name.username,
                    avatar: name.avatar,
                    rating: {
                        rank:name.competitive.rank,
                        rank_img:name.competitive.rank_img
                    },
                    level: name.level
                }
                names.push(user);
            });
             console.log("sending data");
            var data= {
                succes: true,
                data: names
            };
            res.json(data);
         }

        });
    });

    router.get('/Ladder/Top/:start/:end', function (req, res) {
        var start=req.params.start;
        var end= req.params.end;
        Player.find({},function (err, result) {
            if (err) {
                res.status(503).send({succes: false, msg:"no user found matching this name"});
            }
            var length=result.length;
            if(start > length){
                res.status(503).send({succes: false, msg:"You are at the end of our playerbase"});
            }
            if(end > length)end = length;
            var names = [];
            getPlayersByRanking(result,req.params.start,req.params.end).forEach(function (name) {
                var user = {
                    username: name.username,
                    avatar: name.avatar,
                    rating: {
                        rank:name.competitive.rank,
                        rank_img:name.competitive.rank_img
                    },
                    level: name.level,
                    /*stats:{
                        TimePlayed:stats.TimePlayed,
                        TimeOnFire:stats.TimeSpentonFire,
                    }*/
                };
                names.push(user);
            });
            var data= {
                succes: true,
                data: names
            };
            res.json(data);
        });
    });

    router.get('/Players/:query',function (req,res) {
        var query=req.params.query;
        var q =Player.find({username: new RegExp(query, "i")}).sort({username: 1}).limit(10);

        q.exec(function (err,result) {
            if (err) {
                res.status(503).send({succes: false, msg:"no user found matching this name"});
            }
            else{
                console.log(result);
                var names = [];
                result.map(function (name) {
                    var user = {
                        username: name.username,
                        avatar: name.avatar
                    };
                    names.push(user);
                });
                var data= {
                    succes: true,
                    data: names
                };
                res.json(data);
            }
        });
    });

//find a player
    router.get('/Players/User/:username', function (req, res) {
        Player.find({username: req.params.username}, function (err, result) {
            if (err) {
                res.status(503).send({succes: false, msg:"no user found matching this name"});
            }
            var stats=JSON.parse(result[0].stats);
            var name=result[0];
            var user = {
                username: name.username,
                avatar: name.avatar,
                rating: {
                    rank:name.competitive.rank,
                    rank_img:name.competitive.rank_img
                },
                level: name.level,
                stats:stats,
                heroes:name.heroes
            };
            var data= {
                succes: true,
                data: user
            };
            res.json(data);
        });
    });

    router.get('/Players/User/:username/Stats', function (req, res) {
        Player.find({username: req.params.username}, function (err, result) {
            if (err) {
                res.status(503).send({succes: false, msg:"no user found matching this name"});
            }
            console.log("result" + result[0].stats);
            var data= {
                succes: true,
                data: JSON.parse(result[0].stats)
            };
            res.json(data);
        });
    });

    router.get('/Players/User/:username/Heroes', function (req, res) {
        Player.find({username: req.params.username}, function (err, result) {
            if (err) {
                res.status(503).send({succes: false, msg:"no user found matching this name"});
            }
            var data= {
                succes: true,
                data: result[0].heroes
            };
            res.json(data);
        });
    });

    router.get('/Ladder/Distribution',function(req,res){

        Player.find({},function (err,result) {
            var distribution = [];
            var i = 0;
            while(i < 100){
                i++;
                distribution.push(0);
            }
            result.map(function(player) {
                var index=Math.round(player.competitive.rank/50);
                if(index > 1)distribution[index]++;
            });
            var data = {
                succes:true,
                data:distribution
            };
            res.json(data);
        })
    })






    /*
     *============================================
     *   functions
     *============================================
     */
    function checkInput(input) {
        var re = new RegExp("^[A-Za-z0-9_-]+$");
        if (!re.test(input)) {
            console.log('user ' + input + ' skipped');
            return false;
        }
        return true;
    }

    function getPlayersByRanking(input,startRank,endRank){
        input.sort(function(a,b){
            if(a.competitive.rank > b.competitive.rank) return -1;
            else if(a.competitive.rank === b.competitive.rank)return 0;
            return 1;
        });
        return input.slice(startRank,endRank);

    }




    return router;
};

module.exports = createAPI;