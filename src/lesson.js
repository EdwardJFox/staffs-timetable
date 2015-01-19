// Constructor
function Lesson(startTime, endTime, weeks, day, room, type, group, semester, teacher) {
	// always initialize all instance properties
	this.startTime = startTime;
	this.endTime = endTime;
	this.weeks = (weeks == null) ? null : getWeeks(weeks);
	this.day = day;
	this.room = room;
	this.lessonType = type;
	this.group = group;
	this.semester = semester;
	this.teacher = teacher;

	for(var property in this) {
		if(this[property] === null || this[property] === 'undefined'){
			delete this[property];
		}
	}
}

//Returns an array with the number of weeks
function getWeeks(input){
	temp = input.split("-");
	if(temp.length == 1){
		var a = [];
		return a.push(temp[0].replace( /^\D+/g, ''));
	}
	else if(temp.length >1){
		var a = [];
		for(var i = parseInt(temp[0].replace( /^\D+/g, '')); i <= parseInt(temp[1].replace( /^\D+/g, '')); i++){
			a.push(i);
		}
		return a;
	}
	return null;
}

// export the class
module.exports = Lesson;