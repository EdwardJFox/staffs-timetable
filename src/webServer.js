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
var app = express();
var FCETdata = JSON.parse(fs.readFileSync('./output.json', 'utf8'));

//app.set('views', __dirname + '/views')
//app.set('view engine', 'jade')
app.set('json spaces', 40);
app.locals.pretty = true;

//app.use("/css", express.static(__dirname + '/css'));
//app.use("/js", express.static(__dirname + '/js'));

app.get(/^\/timetable\/(?:([\w|\/|\?|\=]+))\//, function(req, res){
	requestedModules = req.url;
	reqMod = req.url.split('/');
	lessonsJSONFile = [];
	var result = "";
	//Trunicate the array to only have the module codes
	if(reqMod[0] == ""){
		reqMod.splice(0, 1);
	}
	if(reqMod[reqMod.length-1] == ""){
		reqMod.splice(reqMod.length-1, 1);
	}
	if(reqMod[0] == "displaymany"){
		reqMod.splice(0, 1);
	}
	for(var j = 0; j < reqMod.length; j++){
		var group = "";
		var reqModCode = reqMod[j];
		if(reqMod[j].charAt(9) == '?'){
			group = reqMod[j].charAt(10);
			reqModCode = reqModCode.substring(0, 9);
		}
		for (var i = 0; i < FCETdata.length; i++){
			if(FCETdata[i]["moduleCode"] == reqModCode){
				var lessons = FCETdata[i]["lessons"].slice(0);
				var tempModule = FCETdata[i];
				tempModule["lessons"].length = 0;
				for(var k = 0; k < lessons.length; k++){
					if(lessons[k]["lessonType"] == "Lec"){
						tempModule["lessons"].push(lessons[k]);
					}
					else if(lessons[k]["lessonType"] == "Prac"){
						if(lessons[k]["group"] == group){
							tempModule["lessons"].push(lessons[k]);
						}
					}
					else if(lessons[k]["lessonType"] == "Tut"){
						if(lessons[k]["group"] == group){
							tempModule["lessons"].push(lessons[k]);
						}
					}
				}
				if(group != ""){
					result += "Module Code: " + FCETdata[i]["moduleCode"] + " Module Name: " + FCETdata[i]["moduleName"] + " In group " + group + " and the lessons are: " + tempModule["lessons"].toString() + "\n";
				}
				else {
					result += "Module Code: " + FCETdata[i]["moduleCode"] + " Module Name: " + FCETdata[i]["moduleName"] + " and the lessons are: " + tempModule["lessons"].toString() + "\n";
				}
				lessonsJSONFile.push(tempModule);
				break;
			}
		}
	}
	/*res.render('index',
		{ json : JSON.stringify(lessonsJSONFile, null, 4) }
	);*/
	res.json(lessonsJSONFile);
})

app.listen(process.env.PORT || 5000);
console.log('Server opened on page ' + process.env.PORT);
exports = module.exports = app;