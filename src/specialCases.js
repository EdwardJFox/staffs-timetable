var specialCases = [
    {
        // Junior+Senior Collaborative Game Development & Testing
        moduleCode : "GAME50170+GAME60247",
        process : function(data){
            for(var i = 0; i < data.lessons.length; i++){
                data.lessons[i].group = data.lessons[i].day;
                data.lessons[i].lessonType = "Prac";
            }
        }
    }
];

function testModule(module){
    for(var i = 0; i < specialCases.length; i++){
        if(module.moduleCode == specialCases[i].moduleCode){
            specialCases[i].process(module);
        }
    }
}

specialCases[0].process(JSON.parse('{"moduleName": "Junior+Senior Collaborative Game Development & Testing", "moduleCode": "GAME50170+GAME60247", "level": 5, "lessons": [{"startTime": "12:00", "endTime": "17:00", "day": "Tue", "room": "G001A, G001B, D011, E006, G001C", "lessonType": "1Prac", "teacher": "Edwards D, Jackson A, Wearn N, Cooke O, Penninck G, Butcher J, Woods M, Butler S, Webster D, Gurney A, Elgon T, Cartwright Y, Whittemore T" },{"startTime": "12:00","endTime": "17:00","day": "Thu","room": "G001A, G001B, D011, E006, G001C","lessonType": "1Prac","teacher": "Edwards D, Beardwood M, Jackson A, Webley S, Penninck G, Butcher J, Woods M, Butler S, Fletcher BD, Gurney A, Elgon T, Cartwright Y, Whittemore T"}]}'));

module.exports = testModule;