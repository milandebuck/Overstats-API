/*============================
*	requires
==============================*/
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var morgan = require('morgan');
var mongoose = require('mongoose');
/*============================
*	program specific requires
==============================*/
var config = ('./config');
var apiroutes = require('./router/apirouter');
//set port
var port = process.env.PORT || 8080;
var options = { replset: { socketOptions: { connectTimeoutMS : 30 }}};
mongoose.connect('mongodb://user:Azerty123@ds151228.mlab.com:51228/projecten2',options);
//catch conn errors
mongoose.connection.on('error', console.error.bind(console, 'MongoDB connection error:'));
//mongoose.connect('mongodb://localhost:27017/Projecten2');
//set secret
app.set('secret','azerty123');
//set bodyparser
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
//cors
app.use(function(req, res, next) {
    res.header('Access-Control-Allow-Origin', req.get('Origin') || '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE');
    res.header('Access-Control-Expose-Headers', 'Content-Length');
    res.header('Access-Control-Allow-Headers', 'Accept, Authorization, Content-Type, X-Requested-With, Range, x-access-token');
    if (req.method === 'OPTIONS') {
        return res.send(200);
    } else {
        return next();
    }
});
app.use(morgan('dev'));
app.use('/api',apiroutes(app));

app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

app.listen(port);
console.log('backend API listening at http://localhost:' + port);

