var express = require('express');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var async = require('async');
var moment = require('moment');
moment().format();

var ModuleObj = require('./moduleobj');
var Lesson = require('./lesson');
var app = express();
var data = [];
var modRegex = /(([A-Z]|[a-z]){4}\d{5}\/?){1,4}/;

async.series([
	function(callback){
		var url = "http://crwnmis3.staffs.ac.uk/modules.htm";
		request(url, function(error, response, html){
			if(!error){
				var n = 0;
				var $ = cheerio.load(html);
				$('select[name="identifier"] > option').each(function (i, row){
					//Replace all the new line charactes with nothing, and replace spaces with +
					var moduleCode = $(row).text().replace(/(\r\n|\n|\r)/gm,"").split(' ').join('+');
					if(modRegex.test(moduleCode)){
						console.log(moduleCode);
						n++;
						tempModule = new ModuleObj(moduleCode, moduleCode.charAt(4));
						data.push(tempModule);
					}
				});
				console.log("There are currently " + n + " modules at Staffordshire University");
				callback();
			}
			else {
				console.log(error);
			}
		});
	},
	/*Scrape timetables*/
	function(callback){
		var weeksStart = moment("04/08/2014", "DD-MM-YYYY");
		var now = moment();
		var thisWeek = now.week();
		var week = now.week() - weeksStart.week()+1;
		week = 29;
		scrapeTimes(0, week);
		function scrapeTimes(i){
			if(i < data.length){
				//modUrl = "http://crwnmis3.staffs.ac.uk/Reporting/TextReport;Modules;name;" + data[i].moduleCode +"?&template=ModuleText2&weeks=" + week + "&days=1-5&periods=5-53";
				modUrl = "http://crwnmis3.staffs.ac.uk/Reporting/TextReport;Modules;name;" + data[i].moduleCode +"?&template=ModuleText2&weeks=8-43&days=1-5&periods=5-53";
				console.log("i is currently " + i + " and length of data is " + data.length);
				request(modUrl, function(err, response, html){
					if( err ) {
						console.log('error: ' + err);
					}
					else {
						try {
							var $ = cheerio.load(html);
							data[i].setModuleName($(".header-2-0-0").html());
							console.log(data[i].getModuleName() + "\tcode: " + data[i].getModuleCode() + "\n");
							$(".report-border-args").each(function () {
								//Get the group that the current lesson being looked at is in, if any at all.
								var groups = $(this).find(".report-1-0-0").html().split("/");
								var type = "";
								var gIndex = 1;
								if(groups[1] === 'undefined'){
									if (groups[1].length == 9) {
										gIndex = 2;
									}
									else {
										type = groups[gIndex];
									}
								}
								group = "";
								if (type == "Prac" || type == "Tut" || type == "Lec") {
								}
								else {
									if (type.substring(0, 4) == "Prac") {
										group = type.charAt(4);
										console.log("The group is: " + group);
										type = "Prac"
									}
									else if (type.substring(0, 3) == "Tut") {
										group = type.charAt(3);
										type = "Tut";
									}
									else if (type.substring(0, 3) == "Lec") {
										group = type.charAt(3);
										type = "Lec";
									}
								}
								//Getting the dates of each of the lessons, then parsing it into a day of the current week
								var dates = $(this).find(".report-2-0-0");
								if (dates != null) {
									dates = $(dates).html().split(",");
								}
								//Start Time
								var startTime = $(this).find(".report-3-0-0").html();
								//End Time
								var endTime = $(this).find(".report-4-0-0").html();
								//Room
								var room = $(this).find(".report-5-0-0").text();
								for (index in dates) {
									//Just to get rid of the leading whitespace in the dates
									dates[index] = dates[index].trim();
									//console.log(startTime + endTime + date + room + type + group )

								}
								//Working out which day it's on
								var momDate = moment(dates[0]);
								switch (momDate.day()) {
									case 1:
										day = "Monday";
										break;
									case 2:
										day = "Tuesday";
										break;
									case 3:
										day = "Wednesday";
										break;
									case 4:
										day = "Thursday";
										break;
									case 5:
										day = "Friday";
										break;
								}
								tempLesson = new Lesson(startTime, endTime, dates, day, room, type, group);
								data[i].addLesson(tempLesson);
							});
						}
						catch(err){
							console.log(err + "\n");
						}
						scrapeTimes(i+1);
						return;
					}
				})
			}
			else {
				callback();
			}
		}
	},
	function(callback){
		fs.writeFile('output.json', JSON.stringify(data, null, 4), function(err){
			console.log('File successfully written! - Check your project directory for the output.json file');
		})
	}
]);