var express = require('express');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var async = require('async');
var crypto = require('crypto');
var moment = require('moment');
moment().format();

var ModuleObj = require('./moduleobj');
var Lesson = require('./lesson');
var app = express();
var FCETdata = JSON.parse(fs.readFileSync('./FCEToutput.json', 'utf8'));

//FCET Tests
app.get('/displayall', function(req, res){
	var result = JSON.parse(fs.readFileSync('./FCEToutput.json', 'utf8'));
	res.send(result);
})
app.get('/displayone/:moduleCode', function(req, res){
	reqMod = req.param("moduleCode");
	var result = JSON.parse(fs.readFileSync('./FCEToutput.json', 'utf8'));
	for (var i = 0; i < result.length; i++){
		if(result[i]["moduleCode"] == reqMod){
			res.send(result[i]["moduleCode"] + " " + result[i]["moduleName"]);	
			break;
		}
		console.log(result[i]["moduleCode"]);
	}
	res.send("Module not found");
})
app.get(/^\/displaymany\/(?:([\w|\/|\?|\=]+))\//, function(req, res){
	requestedModules = req.url;
	var lessonsJSONHash = crypto.createHash('md5').update(requestedModules).digest('hex');
	console.log(lessonsJSONHash);
	reqMod = req.url.split('/');
	lessonsJSONFile = [];
	lessonsJSONFilePath = "./tmp/" + lessonsJSONHash + ".json";
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
		console.log(group);
		for (var i = 0; i < FCETdata.length; i++){
			if(FCETdata[i]["moduleCode"] == reqModCode){
				var lessons = FCETdata[i]["lessons"].slice(0);
				var tempModule = FCETdata[i];
				tempModule["lessons"].length = 0;
				console.log(lessons.length);
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
	console.log(lessonsJSONFile);
	fs.writeFile(lessonsJSONFilePath, JSON.stringify(lessonsJSONFile, null, 4), function(err) {
	    if(err) {
	      console.log(err);
	    }
	    else {
	      console.log("JSON saved to " + lessonsJSONFilePath);
	    }
	}); 
	res.send(result);
})

app.listen('5000')
console.log('Server opened on page 5000');
exports = module.exports = app;