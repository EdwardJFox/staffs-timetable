var express = require('express');
var fs = require('fs');
var path = require("path");
var request = require('request');
var cheerio = require('cheerio');
var async = require('async');
var moment = require('moment');
moment().format();
var chokidar = require('chokidar');
var ua = require('universal-analytics');
var visitor = ua('UA-62453005-3');

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
	var device = "unknown";
	if(req.query.device){
		device = req.query.device;
	}
	visitor.pageview("/timetable").event("Request", "Module List", device).send();
	res.header('Access-Control-Allow-Origin', "*");
	res.json(modData);
});

//GET the relevant timetable entries
//TODO this needs a more robust solution
app.get(/^\/timetable\/(.)+/, function(req, res){
	var device = "unknown";
	for(var propName in req.query) {
		if(req.query.hasOwnProperty(propName) && req.query[propName] != "") {
			device = req.query[propName];
		}
	}
	visitor.pageview(req.url).event("Request", "Timetable", device).send();
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

var watcher = chokidar.watch(['./timetable.json', './modules.json'], {
	ignored: /[\/\\]\./,
	persistent: true
});

watcher.on('change', function(path){
	if(path == "timetable.json"){
		setTimeout(function(){
			timeData = JSON.parse(fs.readFileSync('./timetable.json', 'utf8'));
			console.log("Loaded latest timetable data");
		}, 1000);
	}
	else if(path == "modules.json"){
		setTimeout(function(){
			modData = JSON.parse(fs.readFileSync('./modules.json', 'utf8'));
			console.log("Loaded latest module data");
		}, 1000);
	}
});