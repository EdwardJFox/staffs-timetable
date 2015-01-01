// Constructor
function ModuleObj(moduleCode) {
	// always initialize all instance properties
	this.moduleName = "";
	this.moduleCode = moduleCode;
	var tempChar = moduleCode.charAt(4);
	if(!isNaN(parseInt(tempChar))){
		this.level = parseInt(tempChar);
	}
	else {
		this.level = 0;
	}
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
ModuleObj.prototype.getModuleCode = function(){
	return this.moduleCode;
};

// export the class
module.exports = ModuleObj;