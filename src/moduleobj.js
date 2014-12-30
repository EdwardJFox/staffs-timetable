// Constructor
function ModuleObj(moduleCode, level) {
	// always initialize all instance properties
	this.moduleName = "";
	this.moduleCode = moduleCode;
	this.level = level;
	this.lessons = [];
}
// class methods
ModuleObj.prototype.addLesson = function(lesson) {
	this.lessons.push(lesson);
};
ModuleObj.prototype.setModuleName = function(name){
	this.moduleName = name;
};
ModuleObj.prototype.getModuleName = function(){
	return this.moduleName;
};

// export the class
module.exports = ModuleObj;