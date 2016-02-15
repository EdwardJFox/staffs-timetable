module.exports = {
	response: function(req, res, moment, FCETdata) {
		var formatWeek = false;
		var reqMod = decodeURIComponent(req.url).split('/');
		if(reqMod.length == 1){
			res.send("Invalid API request");
		}
		//Trunicate the array to only have the module codes, specifically at the start and end
		if(reqMod[0] == "" ){ reqMod.splice(0, 1); }
		if(reqMod[0] == "timetable"){ reqMod.splice(0, 1); }
		if(reqMod[reqMod.length-1] == ""){ reqMod.splice(reqMod.length-1, 1); }
		var resJSON = getModules(reqMod, FCETdata);
		res.header('Access-Control-Allow-Origin', "*");
		res.json(resJSON);
	}
};

var getModules = function(reqMod, FCETdata){
	var modules = [];
	var moduleCodes = [];
	for(var i = 0; i < reqMod.length; i++){
		if(reqMod[i].charAt(reqMod[i].length-2) == '?'){
			var result = [];
			result.group = reqMod[i].charAt(reqMod[i].length-1);
			result.moduleCode = reqMod[i].substring(0, reqMod[i].length-2);
			moduleCodes.push(result);
		}
		else {
			var result = [];
			result.moduleCode = reqMod[i].substring(0, reqMod[i].length);
			moduleCodes.push(result);
		}
	}
	for(var i = 0; i < FCETdata.length; i++){
		moduleCodes.forEach(function(data){
			if(data.moduleCode.indexOf(FCETdata[i]["moduleCode"]) > -1){
				if(data.group != undefined){
					modules.push(getGroupLessons(JSON.parse(JSON.stringify(FCETdata[i])), data.group));
				}
				else {
					modules.push(JSON.parse(JSON.stringify(FCETdata[i])));
				}
			}
		})
	}
	return modules;
};

var getGroupLessons = function(module, group){
	var tempLessons = [];
	console.log(tempLessons);
	module.lessons.forEach(function(lesson, index){
		if(lesson.group && lesson.group == group){
			tempLessons.push(lesson);
		} else if(!lesson.group){
			tempLessons.push(lesson);
		}
	});
	console.log(tempLessons);
	module.lessons = tempLessons;
	return module;
};