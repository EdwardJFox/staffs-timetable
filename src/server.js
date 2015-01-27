var express = require('express');
var fs = require('fs');
var path = require("path");
var request = require('request');
var cheerio = require('cheerio');
var async = require('async');
var crypto = require('crypto');
var moment = require('moment');
moment().format();

var ModuleObj = require('./moduleObj');
var Lesson = require('./lesson');
var timetable = require('./api_timetable');
var app = express();
var timeData = JSON.parse(fs.readFileSync('./timetable.json', 'utf8'));
var modData = JSON.parse(fs.readFileSync('./modules.json', 'utf8'));

//app.set('json spaces', 4);
//app.locals.pretty = true;

//Root, not sure what I'll need need to do with this
app.get('/', function (req, res) {
	res.send("hello");
});

//GET a list of all modules available
app.get('/timetable', function(req, res){
	res.header('Access-Control-Allow-Origin', "*");
	res.json(modData);
});

//GET the relevant timetable entries
app.get(/\/timetable\/(?:([\w|\/|\?|\=]+))\//, function(req, res){
	timetable.response(req, res, moment, timeData);
});

//Docs
app.use('/docs', express.static(__dirname + '/docs'));

//Handle 404
app.use(function(req, res) {
	res.status(404).send('404: Page not Found');
});

//Handle 500
app.use(function(error, req, res, next) {
	res.status(500).send('500: Internal Server Error');
});

app.listen(process.env.PORT || 5000);
console.log('Server opened on page ' + process.env.PORT||5000);
exports = module.exports = app;