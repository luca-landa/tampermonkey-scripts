let sheetData = null;

class Time {
    constructor(hours, minutes, positive = true) {
        this.hours = hours || 0;
        this.minutes = minutes || 0;
        this.positive = positive;
    }

    static parse(timeString) {
        const [hours, minutes] = timeString.split(':').map(Number);
        return new Time(hours, minutes);
    }

    add(otherTime) {
        const totalMinutes = this.minutes + otherTime.minutes;
        const carryHours = Math.floor(totalMinutes / 60);
        const sumHours = this.hours + otherTime.hours + carryHours;
        const sumMinutes = totalMinutes % 60;

        return new Time(sumHours, sumMinutes);
    }

    subtract(otherTime) {
        const thisTotalMinutes = this.hours * 60 + this.minutes;
        const otherTotalMinutes = otherTime.hours * 60 + otherTime.minutes;
        const highestTime = Math.max(thisTotalMinutes, otherTotalMinutes);
        const lowestTime = Math.min(thisTotalMinutes, otherTotalMinutes);
        const totalMinutes = highestTime - lowestTime;
        let subtractHours = Math.floor(totalMinutes / 60);
        let subtractMinutes = Math.abs(totalMinutes % 60);

        return new Time(subtractHours, subtractMinutes, thisTotalMinutes === highestTime);
    }

    isZero() {
        return this.hours === 0 && this.minutes === 0;
    }

    toString() {
        const hours = Math.abs(this.hours)
        const minutes = Math.abs(this.minutes);
        const hoursString = hours.toString().padStart(2, '0');
        const minutesString = Math.floor(minutes).toString().padStart(2, '0');
        const sign = this.positive ? '+' : '-';

        return `${sign}${hoursString}:${minutesString}`;
    }
}

function getBValueLabel(innerText) {
   const infoContainers = Array.from(document.querySelectorAll('b-label-value'))
   return infoContainers.find((el) => {
       return el.innerHTML.toLowerCase().includes(innerText);
   });
}

function getDaysWorked() {
    const daysWorkedString = getBValueLabel('days worked').querySelector('h6').innerText;

    const daysWorked = parseInt(daysWorkedString);
    if (getTodayWorkedTime().isZero()) {
        return daysWorked;
    } else {
        return daysWorked - 1;
    }
}

function getWeekDaysWorked() {
  const weekendDaysWorked = sheetData
    .attendance
    .filter(({ exceptions }) => exceptions.workedOnNonWorkingDay)
    .length

  return getDaysWorked() - weekendDaysWorked;
}

function getTotalWorkedTime() {
    const hoursWorkedString = getBValueLabel('hours worked').querySelector('h6').innerText;

    return Time.parse(hoursWorkedString);
}

function getTodayWorkedTime() {
    const hoursWorkedContainers = Array.from(document.querySelectorAll('[col-id="totalHoursDisplay"]'));
    const hoursWorkedTodayString = hoursWorkedContainers[1].innerText;

    return Time.parse(hoursWorkedTodayString);
}

function getTotalWorkedTimeUntilYesterday() {
    return getTotalWorkedTime().subtract(getTodayWorkedTime());
}

function getOvertime() {
    return getTotalWorkedTimeUntilYesterday().subtract(new Time(getWeekDaysWorked() * 8, 0));
}

function deletePreviousOvertime() {
    document.getElementById('overtime')?.remove();
}

function appendOvertime() {
    deletePreviousOvertime();
    const summaryContainer = document.querySelector('b-summary-insights');
    const overtime = summaryContainer.querySelector('b-label-value:last-child').cloneNode(true);

    overtime.id = 'overtime';
    overtime.querySelector('h6 span').innerHTML = getOvertime().toString();
    overtime.querySelector('p span').innerHTML = 'Overtime';
    summaryContainer.appendChild(overtime);
}

function waitForPageRender() {
    let resolvePromise;
    const promise = new Promise(resolve => { resolvePromise = resolve });
    const interval = setInterval(() => {
        if (getBValueLabel('hours worked') && sheetData !== null) {
            resolvePromise();
            clearInterval(interval);
        }
    }, 1000);
    return promise;
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
