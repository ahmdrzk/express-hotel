const OpError = require("./opError");

function fromDateLocaleToDateObj(localeString) {
  /*
  `localeString`: <String> returned from 
    `date.toLocaleString("en-US", {
      timeZone: "Africa/Cairo",
      dateStyle: "full",
      timeStyle: "long",
    })`
  */

  const [, month, day, year, , hour, meridian] = localeString
    .split(", ")
    .map((i) => i.split(" "))
    .flat();

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const hour24 = meridian === "AM" ? Number.parseInt(hour) : Number.parseInt(hour) + 12;

  const dateObj = new Date(year, months.indexOf(month), day, hour24, 0, 0, 0);

  return dateObj;
}

function fromStrToStartDate(startString, checkInLocaleHr = 12) {
  /*
  `startString`: <String> Valid date string
  `checkInLocaleHr`: <Number>
  */

  if (!Date.parse(startString)) throw new OpError(400, "Date string received is not a valid date.");

  const startDate = new Date(startString);
  startDate.setHours(startDate.getHours() + checkInLocaleHr);

  return startDate;
}

function fromStrToEndDate(endString, checkOutLocaleHr = 11) {
  /*
  `startString`: <String> Valid date string
  `checkOutLocaleHr`: <Number>
  */

  if (!Date.parse(endString)) throw new OpError(400, "Date string received is not a valid date.");

  const endDate = new Date(endString);
  endDate.setHours(endDate.getHours() + checkOutLocaleHr);

  return endDate;
}

function getCurrentStartDayDate(checkInLocaleHr = 12) {
  /*
  `checkInLocaleHr`: <Number>
  */

  const currentStartDayDate = new Date();

  currentStartDayDate.getHours() < checkInLocaleHr - 1 &&
    currentStartDayDate.setDate(currentStartDayDate.getDate() - 1);

  currentStartDayDate.setHours(checkInLocaleHr, 0, 0, 0);

  return currentStartDayDate;
}

function getMinStartDate() {
  return getCurrentStartDayDate();
}

function getMaxStartDate() {
  const minStartDate = getMinStartDate();

  /* 15552000000 represents 180 days in ms */
  const maxStartDate = new Date(minStartDate.setTime(minStartDate.getTime() + 15552000000));

  return maxStartDate;
}

function getMinEndDate(startDate, checkOutLocaleHr = 11) {
  /*
  `startDate`: <Date Object>
  `checkOutLocaleHr`: <Number>
  */

  const startCopy = new Date(startDate.getTime());

  /* 86400000 represents 1 day in ms */
  const minEndDate = new Date(startCopy.setTime(startCopy.getTime() + 86400000));
  minEndDate.setHours(checkOutLocaleHr, 0, 0, 0);

  return minEndDate;
}

function getMaxEndDate(startDate, checkOutLocaleHr = 11) {
  /*
  `startDate`: <Date Object>
  `checkOutLocaleHr`: <Number>
  */

  const startCopy = new Date(startDate.getTime());

  /* 7776000000 represents 90 days in ms */
  const maxEndDate = new Date(startCopy.setTime(startCopy.getTime() + 7776000000));
  maxEndDate.setHours(checkOutLocaleHr, 0, 0, 0);

  return maxEndDate;
}

function validateStartDate(startDate) {
  /*
  `startDate`: <Date Object>
  */

  const minDate = getMinStartDate();
  const maxDate = getMaxStartDate();

  return startDate >= minDate && startDate <= maxDate;
}

function validateEndDate(endDate, startDate, checkOutLocaleHr = 11) {
  /*
  `endDate`: <Date Object>
  `startDate`: <Date Object>
  `checkOutLocaleHr`: <Number>
  */

  const minDate = getMinEndDate(startDate, checkOutLocaleHr);
  const maxDate = getMaxEndDate(startDate, checkOutLocaleHr);

  return endDate >= minDate && endDate <= maxDate;
}

module.exports = {
  fromDateLocaleToDateObj,
  fromStrToStartDate,
  fromStrToEndDate,
  getCurrentStartDayDate,
  getMinStartDate,
  getMaxStartDate,
  getMinEndDate,
  getMaxEndDate,
  validateStartDate,
  validateEndDate,
};
