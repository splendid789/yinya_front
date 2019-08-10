'use strict';

class Util {
    getRemainderTime (startTime){
        var s1 = new Date(startTime),
        s2 = new Date(),
        runTime = parseInt((s1.getTime() - s2.getTime()) / 1000);
        var year = Math.floor(runTime / 86400 / 365);
        runTime = runTime % (86400 * 365);
        var month = Math.floor(runTime / 86400 / 30);
        runTime = runTime % (86400 * 30);
        var day = Math.floor(runTime / 86400);
        runTime = runTime % 86400;
        var hour = Math.floor(runTime / 3600);
        runTime = runTime % 3600;
        var minute = Math.floor(runTime / 60);
        runTime = runTime % 60;
        var second = runTime;
    　　return {year, month, day, hour, minute, second};
    }
    getShortText(longText, textNum) {
        var strArr = longText.split('');
        var targetStr = '';
        for(let i = 0, len = strArr.length; i < textNum; i++) {
            if(i >= len) {
                break;
            }
            targetStr += strArr[i];
        }
        return targetStr;
    }
}


export default Util;
