﻿# TimezoneComplete

## Synopsis

TimezoneComplete is a library of date/time utilities, all of which are aware of time zones and daylight saving time. It provides for calculating with Durations (amount of UTC milliseconds) and with Periods (regular intervals in some timezone's time, which might be irregular in UTC). It has aware DateTimes (with timezone) and unaware DateTimes (without timezone) and you are prevented from mixing the two in calculations.

## Difference with timezone-js, Moment.js and other Date libraries

Other libraries are great. In fact, we use timezone-js in our implementation and it works fantastically. We had a different set of requirements, that's all.

1. This library does not emulate the Date class. Its DateTime class does not have the same interface as Date, because the Date interface is broken and inconsistent. It is not a drop-in replacement, however with a few find/replace operations you should be able to convert your project. 
2. This library aims to be "complete", whatever that means. Of course it will never be complete but we will keep adding. We did not find a library out there that has all of the following:
  * Naive dates (which know they have NO timezone information)
  * Aware dates (which have timezone information)
  * Calculating with dates and preserving unit information. Usually calculating with durations requires converting to milliseconds. Your project then becomes littered with "number" type variables that everybody has to guess contains milliseconds. We have a Duration class which you can create and read in terms of Hours, Minutes, Seconds, or Milliseconds. Adding or subtracting DateTimes yields a Duration.
  * Calculating with regular periods. For instance, I could define a period of 12 hours starting at 1970-01-01 08:00:00 Europe/Amsterdam time. What is the next period boundary from the current time?  This cannot be calculated by adding hours to the UTC milliseconds because you have to account for Daylight Saving time.
3. This is not meant to be light-weight. 
4. This is currently not meant to run in a browser, though we suspect it would not take much effort and we'd appreciate a pull request.

## Usage

See also ./doc/modules/index.html.

### Duration

The Duration class is a unit-aware representation of a duration in wall clock time.
You can create a Duration in milliseconds, seconds, minutes or hours and then query the value in another unit.

```javascript
var tc = require("timezonecomplete");

// a duration of 2 seconds
var duration = tc.Duration.seconds(2);

// duration to string
console.log(duration.toString()); // 00:00:02

// convert to different unit
console.log(duration.milliseconds()); // 2000

// arithmetic
var duration2 = duration.multiply(3); // 6 seconds

// min and max functions
var duration3 = duration2.max(duration); // 6 seconds
```

### DateTime
The DateTime class is a replacement (although not drop-in) for the Date class. It has a date value and a time zone. 

The JavaScript Date class contains a value, which is converted from local time to UTC. But what if the value you entered was in a different time zone? Then the UTC value of the JavaScript date is some offset from your timezone time. Date arithmetic becomes impossible because the UTC value depends on what your local Daylight Saving Time happens to be. The DateTime class fixes this.

The DateTime class also fixes various annoyances. 
- All methods are in singular form: "year()" not "years()" and "hour()" not "hours()". The JavaScript Date class mixes these forms. 
- The JavaScript day-of-month is called "date()" instead of "day()". We fixed that.
- We count months from 1 to 12 inclusive like normal human beings, not from 0 to 11 as JavaScript does.

```javascript
var tc = require("timezonecomplete");

// a naive timestamp: 2014-01-01 13:59:59
var naiveDate = new tc.DateTime(2014, 1, 1, 13, 59, 59);

// a local time in the time zone of your computer
var localdate = new tc.DateTime("2014-01-01T12:00:00.001", tc.TimeZone.local());

// a fully aware time
var utcDate = new tc.DateTime(2014, 1, 1, 13, 59, 59, 0, tc.TimeZone.utc());
var amsterdamDate = new tc.DateTime(2014, 1, 1, 13, 59, 59, 0, tc.TimeZone.zone("Europe/Amsterdam"));
var amsterdamDateFromString = new tc.DateTime("2014-01-01T13:59:59.000 Europe/Amsterdam");

// a fully aware time without Daylight Saving Time: a fixed offset from UTC of 2 hours
var fixedOffset = new tc.DateTime("2014-01-01T13:59:59.000+02:00");

console.log(amsterdamDate.toUtcString()); // 2014-01-01T12:59:59.000
console.log(amsterdamDate.toString()); // 2014-01-01T13:59:59.000 Europe/Amsterdam

// time zone conversions
var africaDoualaDate = amsterdamDate.toZone("Africa/Douala");

// Protection against creating aware dates from naive ones
var error = naiveDate.toZone("Europe/Amsterdam"); // throws

// Other way around is ok
var ok = amsterdamDate.toZone(null); // returns naive date

```

### Date Arithmetic

The DateTime class allows advanced date arithmetic. The diff() method returns the difference between two dates as a Duration. Next to that, you can use add() and addLocal() to add either a duration or a specific unit of time. The latter case accounts for DST and leap seconds: addLocal(1, TimeUnit.Hour) ensures that the local hour() field increments by one, even if that means UTC time does not change or changes 2 hours due to DST.


```javascript
// CONTINUATION FROM PREVIOUS EXAMPLE

// difference between dates in different zones
// returns a Duration
var difference = utcDate.diff(amsterdamDate);

console.log(difference.hours()); // 1

// Add a real hour (3600 seconds) to a time
// Note this does NOT account for leap seconds
var added = localdate.add(tc.Duration.hours(1));

// Add a LOCAL hour to a time (ensure the hour() field increments by 1)
// Note this DOES account for leap seconds and DST
var added = localdate.addLocal(1, tc.TimeUnit.Hour);

// Add a UTC hour to a time (ensure the utcHour() increments by 1,
// due to DST changes the local hour might not change or change 2 hours)
// Note this DOES account for leap seconds and DST
var added = localdate.add(1, tc.TimeUnit.Hour);

```

### Periods

We had a need for regularly scheduling a task. However if you think about it, what does it mean to run something every 12 hours? Does that mean it happens at noon every day? Or does it shift with DST?  We needed to be able to specify both.



```javascript
var tc = require("timezonecomplete");

// Repeating daily period at 8:05 local Amsterdam time (moves with Daylight Saving Time so it is always at 8:05 locally)
var period = new tc.Period(new tc.DateTime("2014-01-01T08:05:00 Europe/Amsterdam"), 1, tc.TimeUnit.Day, tc.PeriodDst.RegularLocalTime);

// Repeating daily period at 8:05 local Amsterdam time WITHOUT DST
var period2 = new tc.Period(new tc.DateTime("2014-01-01T08:05:00+01:00"), 1, tc.TimeUnit.Day, tc.PeriodDst.RegularLocalTime);

// You can calculate the first occurrence after a given date (in any time zone)
// "2014-05-01T08:05:00.000 Europe/Amsterdam" 
var occurrence = period.findFirst(new tc.DateTime("2014-04-30T12:00:00 Europe/Amsterdam"));

// findNext works much faster, assuming that its parameter is on a period boundary
// "2014-05-02T08:05:00.000 Europe/Amsterdam" 
var occurrence2 = period.findNext(occurrence);

```


## FAQ

### What time zone names can I use?
See https://en.wikipedia.org/wiki/List_of_tz_database_time_zones

### How do I convert a JavaScript Date object to a DateTime object?

The DateTime class has a constructor that takes a date. It may seem rather complex because the constructor has three parameters. But that was necessary:
1. The first parameter is the Date object.
2. The second parameter indicates which of the two values you want to use: a Date object has a UTC value (getUtcYear()) and a Local value (getYear()). You typically use the local functions, but e.g. if you created your date from a unix timestamp then the UTC date is most accurate.
3. The third parameter gives us the missing info: the time zone the the given value is in. 

```javascript

// construct date from separate year, month, day etc.
var jsDate1 = new Date(2014, 5, 6, 8, 0, 0, 0);

// construct date from unix milliseconds
var jsDate2 = new Date(jsDate1.valueOf());

// now the jsDate.getYear(), jsDate.getMonth() etc are assumed to be in America/Boise zone.
var datetime = new tc.DateTime(jsDate, tc.DateFunctions.Get, tc.TimeZone.zone("America/Boise"));

// now the jsDate.getUTCYear(), jsDate.getUTCMonth() etc are assumed to be in America/Boise zone.
var datetime2 = new tc.DateTime(jsDate, tc.DateFunctions.GetUTC, tc.TimeZone.zone("America/Boise"));

```


## Contributors

Rogier Schouten <r.schouten@spiritit.com>

## License

MIT