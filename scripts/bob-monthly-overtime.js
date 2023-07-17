let sheetData = null;

function formatTime(seconds) {
    const secondsAbs = Math.abs(seconds);
    const hours = Math.floor(secondsAbs / 3600);
    const minutes = Math.floor((secondsAbs % 3600) / 60);
    const hoursString = hours.toString().padStart(2, '0');
    const minutesString = Math.floor(minutes).toString().padStart(2, '0');
    const sign = seconds >= 0 ? '+' : '-';

    return `${sign}${hoursString}:${minutesString}`;
}

function getDaysWorked() {
    const daysWorked = sheetData.summary.actualDaysWorked;
    if (getTodayWorkedSeconds() === 0) {
        return daysWorked;
    } else {
        return daysWorked - 1;
    }
}

function getWeekDaysWorked() {
  const weekendDaysWorked = sheetData
    .attendance
    .filter(({ exceptions }) => exceptions.workedOnNonWorkingDay)
    .length;

  return getDaysWorked() - weekendDaysWorked;
}

function getTotalWorkedSeconds() {
    return sheetData.attendance
        .map((a) => a.totalAttendanceSeconds)
        .reduce((s1, s2) => s1 + s2)
}

function getTodayWorkedSeconds() {
    const lastAttendanceDay = sheetData.attendance[0];
    if (!isToday(lastAttendanceDay.date)) return 0;

    return lastAttendanceDay.totalAttendanceSeconds;
}

function isToday(dateString) {
    return new Date().toDateString() === new Date(dateString).toDateString();
}

function getTotalWorkedSecondsUntilYesterday() {
    return getTotalWorkedSeconds() - getTodayWorkedSeconds();
}

function getOvertimeSeconds() {
    return getTotalWorkedSecondsUntilYesterday() - getWeekDaysWorked() * 8 * 3600;
}

function deletePreviousOvertime() {
    document.getElementById('overtime')?.remove();
}

function appendOvertime() {
    deletePreviousOvertime();
    const summaryContainer = document.querySelector('b-summary-insights');
    const overtimeNode = summaryContainer.querySelector('b-label-value:last-child').cloneNode(true);

    overtimeNode.id = 'overtime';
    overtimeNode.querySelector('h6 span').innerHTML = formatTime(getOvertimeSeconds());
    overtimeNode.querySelector('p span').innerHTML = 'Overtime';
    summaryContainer.appendChild(overtimeNode);
}

function waitForPageRender() {
    let resolvePromise;
    const promise = new Promise(resolve => { resolvePromise = resolve });
    const interval = setInterval(() => {
        if (didUILoad() && sheetData !== null) {
            resolvePromise();
            clearInterval(interval);
        }
    }, 1000);
    return promise;
}

function didUILoad() {
   const infoContainers = Array.from(document.querySelectorAll('b-label-value'))
   return infoContainers.find((el) => {
       return el.innerHTML.toLowerCase().includes('hours worked');
   });
}

function fetchSheetData() {
  fetch("https://app.hibob.com/api/attendance/my/sheets/0")
    .then(res => res.json())
    .then(json => { sheetData = json });
}

function run() {
    appendOvertime();
}

(function() {
    'use strict';

    fetchSheetData();
    waitForPageRender().then(run);
})();
