var express = require('express');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var async = require('async');

var ModuleObj = require('./moduleObj');
var Lesson = require('./lesson');
var specialCases = require('./specialCases.js');
var app = express();
var data = [];
var moduleData = [];
var modRegex = /(([A-Z]|[a-z]){4}\d{5}\/?){1,4}/;
//No longer needed, but keeping them just in case I decide I need them
//var modNameRegex = /(([A-Z]|[a-z]){4}\d{5}\/?){1,4}/g;
//var lessonTypeRegex = /(([A-Z]|[a-z]){2,4}\d{5}-\d)/g;
var weekRegex = /wk/;
var semesterRegex = /sem|Sem/;
var typeRegex = /(Prac|1Prac|2Prac|Tut|Lec|undefined|Careers|Class Test|Demos|Drop-In|Exam|Fieldtrip|GIS Workshop|Ind|Review Session|Revision|Viva|Workshop|Training|Wor|Sk|SAFE)\d+/;
var typeGroupRegex = /(Prac|1Prac|2Prac|Tut|Lec)[ABCDEFGH1234567]/;
var daysRegex = /Mon|Tue|Wed|Thu|Fri/;

var lessonTypes = [type = "Prac", "Tut", "Lec", "1Prac", "2Prac"];

//TODO Exam Timetable extraction http://www.staffs.ac.uk/support_depts/info_centre/exams_and_graduation/
async.series([
    //Scrape each of the module codes, so we know what it is we're going to be iterating through
    function(callback){
        var url = "http://crwnmis3.staffs.ac.uk/modules.htm";
        request(url, function(error, response, html){
            if(!error){
                //Load jQuery for the html page we requested
                var $ = cheerio.load(html);
                //Find the select tag on the page, then go through each option tag under it
                $('select[name="identifier"] > option').each(function (i, row){
                    //Replace all the new line charactes with nothing, and replace spaces and / with with +
                    var moduleCode = $(row).text().replace(/(\r\n|\n|\r)/gm,"").split(' ').join('+').replace(/\//g, "+");
                    //Simple regex test to just make sure that it is in fact a module code
                    if(modRegex.test(moduleCode)){
                        //Create a new ModuleObj for each module
                        tempModule = new ModuleObj(moduleCode);
                        //Push that onto the main data variable
                        data.push(tempModule);
                    }
                });
                callback();
            }
            else {
                console.log(error);
            }
        });
    },
    //Actual timetable scrapes
    function(callback){
        //Simple way of making sure that each scrape happens one after the other, just to make sure I don't do anything bad
        scrapeTimes(0);
        function scrapeTimes(i){
            if(i < data.length){
                //This will get all semesters in the same timetable
                var url = "http://crwnmis3.staffs.ac.uk/Reporting/Individual;Modules;name;" + data[i].moduleCode.replace(/\+/g, "/") +"?&template=Online%20One%20Page%20Module&weeks=24-42&days=1-5&periods=5-53&width=0&height=0";
                //url = "http://crwnmis3.staffs.ac.uk/Reporting/Individual;Modules;name;FORE40253?&template=Online%20One%20Page%20Module&weeks=7-23&days=1-5&periods=5-53&width=0&height=0";
                //For ease of use, output to the console the current page being scraped and its URL, and the progress in the grand scheme of things
                console.log(url);
                console.log("i is currently " + i + " and length of data is " + data.length + " and is on " + data[i].moduleCode);
                request(url, function(err, response, html) {
                    if (err) {
                        console.log('error: ' + err);
                    }
                    else {
                        //Just wrap it all in a try statement for ease of use
                        try {
                            //Load the jquery to make traversing the page a bit easier
                            var $ = cheerio.load(html);
                            var tableRows = $('body > table').eq(1).children('tr');
                            var currentDay = $(tableRows).eq(1).find('td').eq(0).text();
                            var daysLeft = $(tableRows).eq(1).find('td').eq(0).attr('rowspan');
                            data[i].moduleName = $('body > table').eq(0).text().split("Module: " + data[i].moduleCode.replace(/\+/g, "/"))[1].trim();
                            for(var n = 1; n < tableRows.length; n++){
                                //Due to colspan, I need to know when a day is a repeat, so I can ignore the first column for second day entries.
                                var repeatDay = false;
                                //All lessons in a table row have a colspan. This is how the lesson length is displayed
                                var lessons = $(tableRows).eq(n).find('td[colspan]');
                                //Logic for grabbed how many rows are left of the current day
                                if($(tableRows).eq(n).find('td').eq(0).attr('rowspan') > 1 && daysLeft == 0){
                                    daysLeft = $(tableRows).eq(n).find('td').eq(0).attr('rowspan');
                                    if(daysRegex.test($(tableRows).eq(n).find('td').eq(0).text())){
                                        currentDay = $(tableRows).eq(n).find('td').eq(0).text();
                                    }
                                } else if(daysLeft == 0){
                                    daysLeft = 1;
                                    if(daysRegex.test($(tableRows).eq(n).find('td').eq(0).text())){
                                        currentDay = $(tableRows).eq(n).find('td').eq(0).text();
                                    }
                                } else if(n != 1) {
                                    repeatDay = true;
                                }
                                //Now for each lesson in the current row
                                var offset = 0;
                                for(var j = 0; j < lessons.length; j++){
                                    var currentLesson = $(lessons).eq(j);
                                    //Used for the start time of the lesson. Index++ represents a 15 minute jump from 9am, where 1 is 9am.
                                    var index;
                                    repeatDay ? index = $(lessons).eq(j).index() + 1 : index = $(lessons).eq(j).index();
                                    var startTime = decToTimeString((index - 1) * 0.25 + (j * 0.75) + 9 + offset);
                                    var endTime = decToTimeString(((index + parseInt($(lessons).eq(j).attr('colspan')) - (j+1)) * 0.25) + 9 + j + offset);
                                    if(parseInt($(lessons).eq(j).attr('colspan')) > 4){
                                        offset = (parseInt($(lessons).eq(j).attr('colspan')) - 4) * 0.25;
                                    }
                                    //Next grab the lecturer and room
                                    var lecturer = ((l = $(currentLesson).find('table').eq(2).find('td').eq(0).text().trim()) == "") ? null : l;
                                    var room = ((r = $(currentLesson).find('table').eq(2).find('td').eq(1).text().trim()) == "") ? null : r;
                                    var type = null, group = null, semester = 2, weeks = null;
                                    var lessonInfo = $(currentLesson).find('table').eq(0).text().trim().split('/');
                                    for(var k = 0; k < lessonInfo.length; k++){
                                        if(semesterRegex.test(lessonInfo[k])){
                                            //semester = parseInt(lessonInfo[k].charAt(lessonInfo[k].length - 1));
                                            //if(isNaN(semester)){ semester = null; }
                                        } else if(weekRegex.test(lessonInfo[k])) {
                                            weeks = lessonInfo[k].trim();
                                        } else if(typeGroupRegex.test(lessonInfo[k])){
                                            group = lessonInfo[k].charAt(lessonInfo[k].length - 1);
                                            type = lessonInfo[k].substring(0, lessonInfo[k].length -1);
                                        } else if(typeRegex.test(lessonInfo[k])){
                                            type = lessonInfo[k];
                                        }
                                    }
                                    data[i].lessons.push(new Lesson(startTime, endTime, weeks, currentDay, room, type, group, semester, lecturer));
                                    console.log("Day: " + currentDay + "\tStartTime: " + startTime + "\tEndTime: " + endTime + "\tRoom: " + room + "\tLecturer: " + lecturer + "\tType: " + type + "\tGroup: " + group + "\tWeeks: " + weeks + "\tSemester: " + semester);
                                }
                                daysLeft--;
                            }
                            specialCases(data[i]);
                        }
                        //Output the error just in case
                        catch (err) {
                            console.log(err);
                        }
                        //Move onto the next run through of the scrape loop
                        scrapeTimes(i+1);
                        return;
                    }
                })
            }
            else { callback(); }
        }
    },
    function(callback){
        //Now export all of that into a json file, just for
        //fs.writeFile('./node/staffs-timetable-api/timetable.json', JSON.stringify(data, null, 4), function(err){
        fs.writeFile('timetable.json', JSON.stringify(data, null, 4), function(err){
            console.log('Timetable file successfully written! - Check your project directory for the timetable.json file');
        });
        callback();
    },
    //Now that the scrape is done, go through each of the modules to find all of the groups
    function(callback){
        for(var i = 0; i < data.length; i++){
            var groups = [];
            for(var j = 0; j < data[i].lessons.length; j++){
                if(data[i].lessons[j].group){
                    var curGroup = data[i].lessons[j].group;
                    if(groups.indexOf(curGroup) == -1){
                        groups.push(curGroup);
                    }
                }
            }
            //Go through the groups, sort them into alphabetical order and then
            console.log(data[i].moduleCode)
            console.log(groups);
            if(groups.length > 0){
                groups.sort();
                moduleData.push({
                    name : data[i].moduleName,
                    code : data[i].moduleCode,
                    level : data[i].level,
                    groups : groups
                });
            }
            else {
                moduleData.push({
                    name : data[i].moduleName,
                    code : data[i].moduleCode,
                    level : data[i].level
                });
            }
        }
        //Write all of the module data into a file, used in the api to deliver the list of the modules t t
        fs.writeFile('./node/staffs-timetable-api/modules.json', JSON.stringify(moduleData, null, 4), function(err){
        //fs.writeFile('modules.json', JSON.stringify(moduleData, null, 4), function(err){
            console.log('Module file successfully written! - Check your project directory for the modules.json file');
        });
        callback();
    }
]);
//Find the index of module code in the module data, unused but helpful for future reference
function findModuleIndex(moduleCode){
    for(var i = 0; i < data.length; i++){
        if(data[i].moduleCode == moduleCode){
            return i;
        }
    }
    return -1;
}
//Converts the decimal to a standard time format of HH:MM
function decToTimeString(dec){
    var temp = dec.toString().split(".");
    if(temp.length == 2){ return temp[0] + ":" + temp[1] * 6; }
    else { return temp[0] + ":00"; }
}