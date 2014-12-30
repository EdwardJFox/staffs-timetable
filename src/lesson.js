// Constructor
function Lesson(startTime, endTime, date, day, room, type, group) {
	// always initialize all instance properties
	this.startTime = startTime;
	this.endTime = endTime;
	this.date = date;
	this.day = day;
	this.room = room;
	this.lessonType = type;
	this.group = group;
}

// export the class
module.exports = Lesson;