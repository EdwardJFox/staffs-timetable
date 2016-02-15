var weekRegex = /wk/;
var semesterRegex = /sem|Sem/;
var typeRegex = /(Prac|1Prac|2Prac|Tut|Lec|undefined|Careers|Class Test|Demos|Drop-In|Exam|Fieldtrip|GIS Workshop|Ind|Review Session|Revision|Viva|Workshop|Training|Wor|Sk|SAFE)\d+/;
var typeGroupRegex = /(Prac|1Prac|2Prac|Tut|Lec)[ABCDEFGH1234567]/;

var moduleCode = "COSE40577";
var tableRows = $('body > table:eq(1) > tbody > tr');
var currentDay = $(tableRows).eq(1).find('td').eq(0).text();
var daysLeft = $(tableRows).eq(1).find('td').eq(0).attr('rowspan');
var moduleName;
for(var i = 1; i < tableRows.length; i++){
    //Due to colspan, I need to know when a day is a repeat, so I can ignore the first column for second day entries.
    var repeatDay = false;
    //Logic for grabbed how many rows are left of the current day
    if($(tableRows).eq(i).find('td').eq(0).attr('rowspan') > 1 && daysLeft == 0){
        daysLeft = $(tableRows).eq(i).find('td').eq(0).attr('rowspan');
        currentDay = $(tableRows).eq(i).find('td').eq(0).text();
    } else if(daysLeft == 0){
        daysLeft = 1;
        currentDay = $(tableRows).eq(i).find('td').eq(0).text();
    } else if(i != 1) {
        repeatDay = true;
    }
    //All lessons in a table row have a colspan. This is how the lesson length is displayed
    var lessons = $(tableRows).eq(i).find('td[colspan]');
    //Now for each lesson in the current row
    var offset = 0;
    for(var j = 0; j < lessons.length; j++){
        var currentLesson = $(lessons).eq(j);
        //If we don't already have the module name, lets grab that first.
        if(moduleName == undefined){
            moduleName = $(currentLesson).find('table').eq(1).text().trim();
        }
        //Used for the start time of the lesson. Index++ represents a 15 minute jump from 9am, where 1 is 9am.
        var index;
        repeatDay ? index = $(lessons).eq(j).index() + 1 : index = $(lessons).eq(j).index();
        var startTime = decToTimeString((index - 1) * 0.25 + (j * 0.75) + 9 + offset);
        var endTime = decToTimeString(((index + parseInt($(lessons).eq(j).attr('colspan')) - (j+1)) * 0.25) + 9 + j + offset);
        if(parseInt($(lessons).eq(j).attr('colspan')) > 4){
            offset = (parseInt($(lessons).eq(j).attr('colspan')) - 4) * 0.25;
        }
        //Next grab the lecturer and room
        var lecturer = ((l = $(currentLesson).find('table:eq(2)').find('td:eq(0)').text().trim()) == "") ? null : l;
        var room = ((r = $(currentLesson).find('table:eq(2)').find('td:eq(1)').text().trim()) == "") ? null : r;
        var type = null, group = null, semester = null, weeks = null;
        var lessonInfo = $(currentLesson).find('table:eq(0)').text().trim().split('/');
        for(var k = 0; k < lessonInfo.length; k++){
            if(semesterRegex.test(lessonInfo[k])){
                semester = parseInt(lessonInfo[k].charAt(3));
            } else if(weekRegex.test(lessonInfo[k])) {
                weeks = lessonInfo[k];
            } else if(typeGroupRegex.test(lessonInfo[k])){
                group = lessonInfo[k].charAt(lessonInfo[k].length - 1);
                type = lessonInfo[k].substring(0, lessonInfo[k].length -1);
            } else if(typeRegex.test(lessonInfo[k])){
                type = lessonInfo[k];
            }
        }
        console.log("Day: " + currentDay + "\tStartTime: " + startTime + "\tEndTime: " + endTime + "\tRoom: " + room + "\tLecturer: " + lecturer + "\tType: " + type + "\tGroup: " + group + "\tSemester: " + semester);
    }
    daysLeft--;
}
function decToTimeString(dec){
    var temp = dec.toString().split(".");
    if(temp.length == 2){ return temp[0] + ":" + temp[1] * 6; }
    else { return temp[0] + ":00"; }
}