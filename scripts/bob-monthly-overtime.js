let sheetData = null;

function formatTime(seconds, useSign = true) {
  const secondsAbs = Math.abs(seconds);
  const hours = Math.floor(secondsAbs / 3600);
  const minutes = Math.floor((secondsAbs % 3600) / 60);
  const hoursString = hours.toString().padStart(2, '0');
  const minutesString = Math.floor(minutes).toString().padStart(2, '0');
  const sign = seconds >= 0 ? '+' : '-';

  return `${useSign ? sign : ''}${hoursString}:${minutesString}`;
}

function getDaysWorked() {
  let daysWorked = sheetData.summary.actualDaysWorked;
  if (getTodayWorkedSeconds() > 0) {
    daysWorked -= 1;
  }

  return daysWorked;
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
  const targetWorkedDays = getWeekDaysWorked() + sheetData.summary.missingEntries;

  return getTotalWorkedSecondsUntilYesterday() - targetWorkedDays * 8 * 3600;
}

function getClockoutTime() {
  const todayWorkedSeconds = getTodayWorkedSeconds();
  if (todayWorkedSeconds === 0) return null;

  const lastEntrance = sheetData.attendance[0].entries.find((entry) => entry.end == null);
  if (!lastEntrance) return null;

  const lastEntranceStartDate = new Date(lastEntrance.start);
  const lastEntranceStartSeconds = lastEntranceStartDate.getSeconds() + lastEntranceStartDate.getMinutes() * 60 + lastEntranceStartDate.getHours() * 3600;

  const remainingSeconds = (8 * 3600) - getTodayWorkedSeconds();
  const exitTimeSeconds = lastEntranceStartSeconds + remainingSeconds;

  return formatTime(exitTimeSeconds, false);
}

function createSummaryNode(id, title, body) {
  document.getElementById(id)?.remove();
  const summaryContainer = document.querySelector('b-summary-insights');
  const node = summaryContainer.querySelector('b-label-value:last-child').cloneNode(true);

  node.id = 'overtime';
  node.querySelector('h6 span').innerHTML = body;
  node.querySelector('p span').innerHTML = title;
  summaryContainer.appendChild(node);
}

function appendOvertime() {
  createSummaryNode('overtime', 'Overtime', formatTime(getOvertimeSeconds()));
}

function appendClockoutTime() {
  const clockoutTime = getClockoutTime();
  if (clockoutTime) {
    createSummaryNode('clockout_time', 'Clockout at', getClockoutTime());
  }
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
  appendClockoutTime();
}

(function() {
  'use strict';

  fetchSheetData();
  waitForPageRender().then(run);
})();
