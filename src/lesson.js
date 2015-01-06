// Constructor
function Lesson(startTime, endTime, date, day, room, type, group, semester) {
	// always initialize all instance properties
	this.startTime = startTime;
	this.endTime = endTime;
	this.date = date;
	this.day = day;
	this.room = room;
	this.lessonType = type;
	this.group = group;
	this.semester = semester;
}

// export the class
module.exports = Lesson;