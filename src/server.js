var express = require('express');
var fs = require('fs');
var path = require("path");
var request = require('request');
var cheerio = require('cheerio');
var async = require('async');
var crypto = require('crypto');
var moment = require('moment');
moment().format();

var ModuleObj = require('./moduleobj');
var Lesson = require('./lesson');
var timetable = require('./api_timetable');
var app = express();
var FCETdata = JSON.parse(fs.readFileSync('./output.json', 'utf8'));

//app.set('json spaces', 4);
//app.locals.pretty = true;

app.get('/timetable'), function(req, res){

};
app.get(/\/timetable\/(?:([\w|\/|\?|\=]+))\//, function(req, res){
	timetable.response(req, res, moment, FCETdata);
});

app.listen(process.env.PORT || 5000);
console.log('Server opened on page ' + process.env.PORT||5000);
exports = module.exports = app;