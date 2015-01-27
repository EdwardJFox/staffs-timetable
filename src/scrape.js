var express = require('express');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var async = require('async');
var moment = require('moment');
moment().format();

var ModuleObj = require('./moduleObj');
var Lesson = require('./lesson');
var app = express();
var data = [];
var moduleData = [];
var modRegex = /(([A-Z]|[a-z]){4}\d{5}\/?){1,4}/;
var modNameRegex = /(([A-Z]|[a-z]){4}\d{5}\/?){1,4}/g;
var lessonTypeRegex = /(([A-Z]|[a-z]){2,4}\d{5}-\d)/g;
var weekRegex = /wk/;
var semesterRegex = /sem|Sem/;
var typeRegex = /(Prac|1Prac|2Prac|Tut|Lec|undefined|Careers|Class Test|Demos|Drop-In|Exam|Fieldtrip|GIS Workshop|Ind|Review Session|Revision|Viva|Workshop|Training)$/;
var typeGroupRegex = /Prac|1Prac|2Prac|Tut|Lec/;


async.series([
    function(callback){
        var url = "http://crwnmis3.staffs.ac.uk/modules.htm";
        request(url, function(error, response, html){
            if(!error){
                var $ = cheerio.load(html);
                $('select[name="identifier"] > option').each(function (i, row){
                    //Replace all the new line charactes with nothing, and replace spaces and / with with +
                    var moduleCode = $(row).text().replace(/(\r\n|\n|\r)/gm,"").split(' ').join('+').replace("/", "+");
                    if(modRegex.test(moduleCode)){
                        tempModule = new ModuleObj(moduleCode);
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
    /*Scrape timetables*/
    function(callback){
        var weeksStart = moment("04/08/2014", "DD-MM-YYYY");
        var now = moment();
        var thisWeek = now.week();
        var week = now.week() - weeksStart.week()+1;
        week = 29;
        scrapeTimes(0);
        function scrapeTimes(i){
            if(i < data.length){
                //var url = "http://crwnmis3.staffs.ac.uk/Reporting/Individual;Modules;name;COIS51030?&template=Online%20One%20Page%20Module&weeks=7-48&days=1-5&periods=5-53&width=0&height=0";
                //This will get all semesters in the same timetable
                var url = "http://crwnmis3.staffs.ac.uk/Reporting/Individual;Modules;name;" + data[i].moduleCode.replace("+", "/") +"?&template=Online%20One%20Page%20Module&weeks=7-48&days=1-5&periods=5-53&width=0&height=0";
                //This will get just semester 2
                //var url = "http://crwnmis3.staffs.ac.uk/Reporting/Individual;Modules;name;" + data[i].moduleCode.replace("+", "/") +"?&template=Online%20One%20Page%20Module&weeks=24-42&days=1-5&periods=5-53&width=0&height=0";
                console.log(url);
                console.log("i is currently " + i + " and length of data is " + data.length + " and is on " + data[i].moduleCode);
                request(url, function(err, response, html) {
                    if (err) {
                        console.log('error: ' + err);
                    }
                    else {
                        try {
                            var $ = cheerio.load(html);
                            //Give the associated module code it's proper module name
                            data[i].moduleName = $('.header-1-0-3').text().replace("/", "+");
                            var currentDay;
                            $(".grid-border-args > tr").each(function () {
                                var n = 0;
                                $(this).find('td').each(function () {
                                    if ($(this).hasClass("row-label-one")) {
                                        currentDay = $(this).text().replace(/\s/g, "");
                                    }
                                    else {
                                        if ($(this).hasClass('object-cell-border')) {
                                            var lessonStartTime = decToTimeString(9 + (n * 0.25));
                                            var lessonEndTime = decToTimeString((9 + (n * 0.25)) + (parseInt($(this).attr('colspan')) * 0.25));
                                            //The first block of info in the box, giving the module code, type, and time
                                            var moduleInfo = $(this).find(".object-cell-args").eq(0).text().replace(/\s/g, "").split("/");
                                            var type = null, group = null, semester = null, weeks = null;
                                            if(moduleInfo.length == 1){
                                                type = "Lec";
                                            }
                                            else {
                                                for (var j = 1; j < moduleInfo.length; j++){
                                                    if(semesterRegex.test(moduleInfo[j])){
                                                        var tempSemester = moduleInfo[j];
                                                        if(tempSemester.substring(0,2) == "04" || tempSemester.substring(0,2) == "10" || tempSemester.substring(0,2) == "11" || tempSemester.substring(0,2) == "12" || tempSemester.substring(0,2) == "13" || tempSemester.substring(0,2) == "14"){
                                                            semester = parseInt(tempSemester.substr(5,1));
                                                        }
                                                        else {
                                                            semester = parseInt(tempSemester.replace( /^\D+/g, ''));
                                                        }
                                                    }
                                                    else if(weekRegex.test(moduleInfo[j])){
                                                        weeks = moduleInfo[j]
                                                    }
                                                    else if(typeRegex.test(moduleInfo[j])){
                                                        type = moduleInfo[j];
                                                    }
                                                    else if(typeGroupRegex.test(moduleInfo[j])){
                                                        type = moduleInfo[j];
                                                        if (type.substring(0, 4) == "Prac") {
                                                            group = type.charAt(4);
                                                            type = "Prac";
                                                        }else if (type.substring(0, 3) == "Tut") {
                                                            group = type.charAt(3);
                                                            type = "Tut";
                                                        }else if (type.substring(0, 3) == "Lec") {
                                                            group = type.charAt(3);
                                                            type = "Lec";
                                                        }else if (type.substring(0, 5) == "1Prac") {
                                                            group = type.charAt(5);
                                                            type = "1Prac";
                                                        }else if (type.substring(0, 5) == "2Prac") {
                                                            group = type.charAt(5);
                                                            type = "2Prac";
                                                        }
                                                    }
                                                }
                                            }
                                            var teacher = (((t = $(this).find(".object-cell-args").eq(2).find("td[align='left']").text()) == "") ? null : t);
                                            var room = (((r = $(this).find(".object-cell-args").eq(2).find("td[align='right']").text()) == "") ? null : r);
                                            //Lessons
                                            data[i].lessons.push(new Lesson(lessonStartTime, lessonEndTime, weeks, currentDay, room, type, group, semester, teacher));
                                            //console.log("Type : " + type + "\t Day : " + currentDay + "\t Time : " + lessonStartTime + "\t Group : " + group + "\t Room : " + room + "\t Teacher : " + teacher);
                                            n--;
                                            if(parseInt($(this).attr('colspan'))*0.25 > 1){
                                                n = n + (parseInt(($(this).attr('colspan'))*0.25)-1)*4;
                                            }
                                        }
                                        n++;
                                    }
                                });
                            });
                        }
                        catch (err) {
                            console.log(err);
                        }
                        scrapeTimes(i+1);
                        return;
                    }
                })
            }
            else { callback(); }
        }
    },
    function(callback){
        fs.writeFile('timetable.json', JSON.stringify(data, null, 4), function(err){
            console.log('Timetable file successfully written! - Check your project directory for the timetableTest.json file');
        });
        callback();
    },
    function(callback){
        for(var i = 0; i < data.length; i++){
            moduleData.push({
                name : data[i].moduleName,
                code : data[i].moduleCode,
                level : data[i].level
            });
        }
        fs.writeFile('modules.json', JSON.stringify(moduleData, null, 4), function(err){
            console.log('Module file successfully written! - Check your project directory for the modules.json file');
        });
        callback();
    }
]);
//Find the index of module code in the module data
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