// Constructor
function ModuleObj(moduleCode) {
	// always initialize all instance properties
	this.moduleName = "";
	this.moduleCode = moduleCode;
	var tempChar = moduleCode.charAt(4);
	if(!isNaN(parseInt(tempChar))){
		this.level = parseInt(tempChar);
	}
	else if(this.moduleCode.indexOf("-") > 0){
		this.level = parseInt(this.moduleCode.charAt(this.moduleCode.indexOf("-") + 1));
	}
	else {
		this.level = 0;
	}
	this.lessons = [];
}

// export the class
module.exports = ModuleObj;