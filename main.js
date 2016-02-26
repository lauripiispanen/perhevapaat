$(function() {

  var SETTING_DUE_DATE = "SETTING_DUE_DATE"
  var SETTING_MATERNITY_START = "SETTING_MATERNITY_START"
  var EDITING_PARENTAL_LEAVE = "EDITING_PARENTAL_LEAVE"
  var DRAGGING_PARENTAL_LEAVE = "DRAGGING_PARENTAL_LEAVE"
  var NUM_MATERNITY_DAYS = 105
  var NUM_PARENTAL_DAYS = 158
  var NUM_PATERNAL_DAYS = 54

  var state = {
    dueDate: null,
    validMaternityStartDays: [],
    maternityDays: [],
    parentalDays: [],
    paternalDays: [],
    dragPaternalDays: [],
    action: SETTING_DUE_DATE
  }

  var dateClicks = $(".calendar")
                      .asEventStream("click", ".day")
                      .map(".target")
                      .map(extractDateDesignator)

  dateClicks.filter(isSettingDueDate).onValue(applyDueDate)
  dateClicks.filter(isDueDate).onValue(clearDueDate)
  dateClicks.filter(isSettingMaternityStart).onValue(setMaternityStart)

  $(".info").asEventStream("click", ".edit_parental_leaves").onValue(function() {
    if (state.action == EDITING_PARENTAL_LEAVE || state.action == DRAGGING_PARENTAL_LEAVE) {
      state.action = null
    } else {
      state.action = EDITING_PARENTAL_LEAVE
    }
  })

  $(".info").asEventStream("click", ".edit_due_date").onValue(function() {
    state.action = SETTING_DUE_DATE
  })

  $(".calendar").asEventStream("mousedown", ".day")
                .filter(isEditingPaternalLeave)
                .map(".target")
                .map(extractDateDesignator)
                .onValue(function(date) {
                  state.action = DRAGGING_PARENTAL_LEAVE
                  state.dragStartDate = date
                  if (isPaternalDate(date)) {
                    state.dragMode = "remove"
                  } else {
                    state.dragMode = "add"
                  }
                  state.dragPaternalDays = [date]
                })

  $(".calendar").asEventStream("mousemove", ".day")
                .filter(isDraggingPaternalLeave)
                .map(".target")
                .map(extractDateDesignator)
                .skipDuplicates()
                .onValue(function(date) {
                  state.dragPaternalDays = weekDaysBetween(state.dragStartDate, date)
                  refresh()
                })

  $(".calendar").asEventStream("mouseup", ".day")
                .filter(isDraggingPaternalLeave)
                .onValue(function() {
                  state.action = EDITING_PARENTAL_LEAVE
                  state.dragStartDate = null
                  if (state.dragMode == "remove") {
                    state.paternalDays = state.paternalDays.filter(function(it) {
                      return state.dragPaternalDays.indexOf(it) == -1
                    })
                  } else {
                    var newDays = state.dragPaternalDays.filter(function(it) {
                      return state.paternalDays.indexOf(it) == -1
                    })
                    state.paternalDays = state.paternalDays.concat(newDays)
                  }

                  state.dragPaternalDays = []
                  refresh()
                })

  function renderCalendar() {
    $(".calendar").empty().append(createDateTable())
    $(".info").empty().append(createInfoView())
  }

  function refresh() {
    ["due_date", "valid-maternity-start", "maternity", "parental", "paternal"].forEach(function(cl) {
      $("." + cl).removeClass(cl)
    })

    markDateNodesWith([state.dueDate], "due_date")
    if (isSettingMaternityStart()) {
      markDateNodesWith(state.validMaternityStartDays, "valid-maternity-start")
    }

    markDateNodesWith(state.maternityDays, "maternity")
    markDateNodesWith(state.parentalDays, "parental")
    markDateNodesWith(state.paternalDays, "paternal")

    if (state.dragMode == "remove") {
      state.dragPaternalDays.forEach(function(date) {
        $("#day-node-" + date).removeClass("paternal")
      })
    } else if (state.dragMode == "add") {
      markDateNodesWith(state.dragPaternalDays, "paternal")
    }

  }

  function markDateNodesWith(dates, className) {
    dates.forEach(function(date) {
      $("#day-node-" + date).addClass(className)
    })
  }

  function createDateTable() {
    var now = moment()
    var weeks = Math.floor(moment.duration(moment().weekday(0).add(3, 'years').diff(now)).asWeeks())
    var date = moment().subtract(1, 'days').day(1)
    var element = "<div>"

    for (var i = 0; i < weeks; i++) {
      var text = "<div class='calendar__week_row'>"

      var classes = ['month_name', oddOrEvenMonthAdjusted(date)]
      if (date.month() == 0 && shouldHaveMonthTitle(date)) {
        classes.push('start_of_year')
      }

      text += "<div class='"+ classes.join(' ') +"'>"+monthTitleOrEmpty(date)+"</div>"
      text += renderWeek(moment(date).subtract(1, 'days'))+"</div>"
      date.add(1, 'weeks')
      element += text
    }
    return element + "</div>"
  }

  function renderWeek(date) {
    var text = ""
    for (var i = 0; i < 7; i++) {
      date.add(1, 'days')
      var classes = ['day', oddOrEvenMonth(date)]
      var dateDesignator = date.date() + "-" + (date.month() + 1) + "-" + date.year()
      if (isHoliday(dateDesignator)) { classes.push("holiday") }
      if (isSundayMoment(date)) { classes.push("sunday") }
      text += "<div class='"+ classes.join(" ") +"' data-date='"+ dateDesignator +"' id='day-node-"+dateDesignator+"'>"+date.date()+"</div>"
    }
    return text
  }

  function createInfoView() {
    var nodes = [
      "<h3>Laskettu aika: "+(state.dueDate || "")+"<button class='edit_due_date'>Muokkaa</button></h3>",
      "<h3>&Auml;itiysraha: "+(state.maternityStart || "")+(state.maternityEnd ? " - " + state.maternityEnd : "") +"</h3>",
      "<h3>Vanhempainraha: "+(state.parentalStart || "")+(state.parentalEnd ? " - " + state.parentalEnd : "") +"</h3>",
      "<h3>Isyysvapaat: "+ numOfPaternalDaysLeft() +"pv <button class='edit_parental_leaves'>Muokkaa</button></h3>",
      createParentalLeaveList()
    ]
    return $(nodes.join(""))
  }

  function numOfPaternalDaysLeft() {
    return NUM_PATERNAL_DAYS - state.paternalDays.length
  }

  function createParentalLeaveList() {

  }

  function oddOrEvenMonth(date) {
    return date.month() % 2 == 0 ? "even" : "odd"
  }

  function oddOrEvenMonthAdjusted(date) {
    return date.month() % 2 == 0 && date.weekday() == 1 ? "even" : "odd"
  }

  function monthTitleOrEmpty(date) {
     return shouldHaveMonthTitle(date) ? date.format("MMMM YYYY") : ""
  }

  function shouldHaveMonthTitle(date) {
    return date.date() < 8
  }

  function formatDayStr(date) {
    return "" + date.date()
  }

  function isHoliday(dateDesignator) {
    return holidays[dateDesignator]
  }

  function formatDateDesignator(date) {
    return date.date() + "-" + (date.month() + 1) + "-" + date.year()
  }

  function extractDateDesignator(node) {
    return $(node).attr("data-date")
  }

  function hasSelectedDueDate() {
    return state.dueDate != null
  }

  function not(fn) {
    return function() {
      return !fn.apply(fn, arguments)
    }
  }

  function applyDueDate(date) {
    state.dueDate = date
    state.action = SETTING_MATERNITY_START
    state.validMaternityStartDays = calculateValidMaternityStartDatesFrom(state.dueDate)
    clearMaternityStart()
    clearParentalStart()
    refresh()
  }

  function calculateValidMaternityStartDatesFrom(dueDate) {
    return calculateWeekdaysFrom(dueDate, 51, 'subtract').slice(30)
  }

  function isValidMaternityStart(dateDesignator) {
    return state.validMaternityStartDays.indexOf(dateDesignator) > -1
  }

  function isSundayOrHoliday(dateDesignator) {
    if (isHoliday(dateDesignator)) {
      return true
    } else {
      return isSunday(dateDesignator)
    }
  }

  function isMaternityDate(dateDesignator) {
    return state.maternityDays.indexOf(dateDesignator) > -1
  }

  function isParentalDate(dateDesignator) {
    return state.parentalDays.indexOf(dateDesignator) > -1
  }

  function isPaternalDate(dateDesignator) {
    if (state.dragMode == "remove" && state.dragPaternalDays.indexOf(dateDesignator) > -1) {
      return false
    } else if (state.dragMode == "add" && state.dragPaternalDays.indexOf(dateDesignator) > -1) {
      return true
    } else {
      return state.paternalDays.indexOf(dateDesignator) > -1
    }


  }

  function isSunday(dateDesignator) {
    return moment(dateDesignator, "DD-MM-YYYY").day() == 0
  }

  function isSundayMoment(mom) {
    return mom.day() == 0
  }

  function isDueDate(dateDesignator) {
    return dateDesignator === state.dueDate
  }

  function clearDueDate() {
    state.dueDate = null
    state.action = SETTING_DUE_DATE
    clearMaternityStart()
    clearParentalStart()
    refresh()
  }

  function clearMaternityStart() {
    state.maternityStart = null
    state.maternityDays = []
    state.maternityEnd = null
  }

  function clearParentalStart() {
    state.parentalStart = null
    state.parentalDays = []
    state.parentalEnd = null
  }

  function setMaternityStart(dateDesignator) {
    if (isValidMaternityStart(dateDesignator)) {
      state.maternityStart = dateDesignator
      state.maternityDays = calculateMaternityDates(state.maternityStart)
      state.maternityEnd = state.maternityDays[NUM_MATERNITY_DAYS - 1]
      state.action = null

      setParentalLeaveStart(nextWeekdayFrom(state.maternityEnd))
      refresh()
    }
  }

  function setParentalLeaveStart(dateDesignator) {
    state.parentalStart = dateDesignator
    state.parentalDays = calculateWeekdaysFrom(dateDesignator, NUM_PARENTAL_DAYS)
    state.parentalEnd = state.parentalDays[NUM_PARENTAL_DAYS - 1]
  }

  function nextWeekdayFrom(dateDesignator) {
    var dt = moment(dateDesignator, "DD-MM-YYYY")
    do {
      dt.add(1, 'days')
    } while (dt.day() == 0 || dt.day() == 6)
    return formatDateDesignator(dt)
  }

  function weekDaysBetween(start, end) {
    var startMoment = moment(start, "DD-MM-YYYY")
    var endMoment = moment(end, "DD-MM-YYYY")
    if (endMoment.isBefore(startMoment)) {
      var tempStartMoment = startMoment
      startMoment = endMoment
      endMoment = tempStartMoment
    }
    var days = endMoment.diff(startMoment, 'days')

    return Array.apply(null, {length: days + 1}).map(function(it, idx) {
      return formatDateDesignator(moment(startMoment).add(idx, 'days'))
    }).filter(not(isSundayOrHoliday))
  }

  function calculateMaternityDates(maternityStart) {
    return calculateWeekdaysFrom(maternityStart, NUM_MATERNITY_DAYS)
  }

  function calculateWeekdaysFrom(date, num, operator) {
    var datemoment = moment(date, "DD-MM-YYYY")
    var op = operator || "add"
    if (!datemoment.isValid()) {
      return []
    }
    var weekdays = Array.apply(null, {length: num * 2}).map(function(it, idx) {
      return formatDateDesignator(moment(datemoment)[op](idx, 'days'))
    }).filter(not(isSundayOrHoliday))
    return weekdays.slice(0, num)
  }

  function isSettingMaternityStart() {
    return state.action == SETTING_MATERNITY_START
  }

  function isSettingDueDate() {
    return state.action == SETTING_DUE_DATE
  }

  function isEditingPaternalLeave() {
    return state.action == EDITING_PARENTAL_LEAVE
  }

  function isDraggingPaternalLeave() {
    return state.action == DRAGGING_PARENTAL_LEAVE
  }



  var holidays = {
    "1-1-2016": "Uudenvuodenpäivä",
    "6-1-2016": "Loppiainen",
    "31-1-2016": "Kynttilänpäivä",
    "7-2-2016": "Laskiaissunnuntai",
    "13-3-2016": "Marian ilmestyspäivä",
    "20-3-2016": "Palmusunnuntai",
    "25-3-2016": "Pitkäperjantai",
    "27-3-2016": "Pääsiäissunnuntai",
    "28-3-2016": "Toinen pääsiäispäivä",
    "1-5-2016": "Vappu",
    "5-5-2016": "Helatorstai",
    "15-5-2016": "Helluntai",
    "15-5-2016": "Kaatuneiden muistopäivä",
    "22-5-2016": "Pyhän Kolminaisuuden päivä",
    "25-6-2016": "Juhannus",
    "26-6-2016": "Apostolien päivä",
    "10-7-2016": "Kirkastussunnuntai",
    "2-10-2016": "Mikkelinpäivä",
    "5-11-2016": "Pyhäinpäivä",
    "20-11-2016": "Tuomiosunnuntai",
    "6-12-2016": "Suomen itsenäisyyspäivä",
    "25-12-2016": "Joulupäivä",
    "26-12-2016": "Tapaninpäivä",
    "1-1-2017" : "Uudenvuodenpäivä",
    "6-1-2017" : "Loppiainen",
    "5-2-2017" : "Kynttilänpäivä",
    "26-2-2017" : "Laskiaissunnuntai",
    "26-3-2017" : "Marian ilmestyspäivä",
    "9-4-2017" : "Palmusunnuntai",
    "14-4-2017" : "Pitkäperjantai",
    "16-4-2017" : "Pääsiäissunnuntai",
    "17-4-2017" : "Toinen pääsiäispäivä",
    "1-5-2017" : "Vappu",
    "21-5-2017" : "Kaatuneiden muistopäivä",
    "25-5-2017" : "Helatorstai",
    "4-6-2017" : "Helluntai",
    "11-6-2017" : "Pyhän Kolminaisuuden päivä",
    "24-6-2017" : "Juhannus",
    "16-7-2017" : "Apostolien päivä",
    "30-7-2017" : "Kirkastussunnuntai",
    "1-10-2017" : "Mikkelinpäivä",
    "4-11-2017" : "Pyhäinpäivä",
    "26-11-2017" : "Tuomiosunnuntai",
    "6-12-2017" : "Suomen itsenäisyyspäivä",
    "25-12-2017" : "Joulupäivä",
    "26-12-2017" : "Tapaninpäivä",
    "1-1-2018" : "Uudenvuodenpäivä",
    "6-1-2018" : "Loppiainen",
    "4-2-2018" : "Kynttilänpäivä",
    "11-2-2018" : "Laskiaissunnuntai",
    "18-3-2018" : "Marian ilmestyspäivä",
    "25-3-2018" : "Palmusunnuntai",
    "30-3-2018" : "Pitkäperjantai",
    "1-4-2018" : "Pääsiäissunnuntai",
    "2-4-2018" : "Toinen pääsiäispäivä",
    "1-5-2018" : "Vappu",
    "10-5-2018" : "Helatorstai",
    "20-5-2018" : "Helluntai",
    "20-5-2018" : "Kaatuneiden muistopäivä",
    "27-5-2018" : "Pyhän Kolminaisuuden päivä",
    "23-6-2018" : "Juhannus",
    "1-7-2018" : "Apostolien päivä",
    "15-7-2018" : "Kirkastussunnuntai",
    "30-9-2018" : "Mikkelinpäivä",
    "3-11-2018" : "Pyhäinpäivä",
    "25-11-2018" : "Tuomiosunnuntai",
    "6-12-2018" : "Suomen itsenäisyyspäivä",
    "25-12-2018" : "Joulupäivä",
    "26-12-2018" : "Tapaninpäivä",
    "1-1-2019" : "Uudenvuodenpäivä",
    "6-1-2019" : "Loppiainen",
    "3-2-2019" : "Kynttilänpäivä",
    "3-3-2019" : "Laskiaissunnuntai",
    "24-3-2019" : "Marian ilmestyspäivä",
    "14-4-2019" : "Palmusunnuntai",
    "19-4-2019" : "Pitkäperjantai",
    "21-4-2019" : "Pääsiäissunnuntai",
    "22-4-2019" : "Toinen pääsiäispäivä",
    "1-5-2019" : "Vappu",
    "19-5-2019" : "Kaatuneiden muistopäivä",
    "30-5-2019" : "Helatorstai",
    "9-6-2019" : "Helluntai",
    "16-6-2019" : "Pyhän Kolminaisuuden päivä",
    "22-6-2019" : "Juhannus",
    "21-7-2019" : "Apostolien päivä",
    "4-8-2019" : "Kirkastussunnuntai",
    "29-9-2019" : "Mikkelinpäivä",
    "2-11-2019" : "Pyhäinpäivä",
    "24-11-2019" : "Tuomiosunnuntai",
    "6-12-2019" : "Suomen itsenäisyyspäivä",
    "25-12-2019" : "Joulupäivä",
    "26-12-2019" : "Tapaninpäivä",
    "1-1-2020" : "Uudenvuodenpäivä",
    "6-1-2020" : "Loppiainen",
    "2-2-2020" : "Kynttilänpäivä",
    "23-2-2020" : "Laskiaissunnuntai",
    "22-3-2020" : "Marian ilmestyspäivä",
    "5-4-2020" : "Palmusunnuntai",
    "10-4-2020" : "Pitkäperjantai",
    "12-4-2020" : "Pääsiäissunnuntai",
    "13-4-2020" : "Toinen pääsiäispäivä",
    "1-5-2020" : "Vappu",
    "17-5-2020" : "Kaatuneiden muistopäivä",
    "21-5-2020" : "Helatorstai",
    "31-5-2020" : "Helluntai",
    "7-6-2020" : "Pyhän Kolminaisuuden päivä",
    "20-6-2020" : "Juhannus",
    "12-7-2020" : "Apostolien päivä",
    "26-7-2020" : "Kirkastussunnuntai",
    "4-10-2020" : "Mikkelinpäivä",
    "31-10-2020" : "Pyhäinpäivä",
    "22-11-2020" : "Tuomiosunnuntai",
    "6-12-2020" : "Suomen itsenäisyyspäivä",
    "25-12-2020" : "Joulupäivä",
    "26-12-2020" : "Tapaninpäivä",
  }

  renderCalendar()

})
