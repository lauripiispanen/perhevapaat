$(function() {

  var state = {}

  var dateClicks = $(".calendar")
                      .asEventStream("click", ".day")
                      .map(".target")
                      .map(extractDateDesignator)

  dateClicks.filter(not(hasSelectedDueDate)).onValue(applyDueDate)
  dateClicks.filter(isDueDate).onValue(clearDueDate)

  function reRender() {
    $(".calendar").empty().append(createDateTable())
    $(".info").empty().append(createInfoView())
  }

  function createDateTable() {
    var now = moment()
    var weeks = Math.floor(moment.duration(moment().weekday(0).add(3, 'years').diff(now)).asWeeks())
    var date = moment().subtract(1, 'days').weekday(0)
    return $(Array.apply(null, {length: weeks}).map(function(it, idx) {
      var text = "<div class='calendar__week_row'>"
      text += "<div class='month_name "+oddOrEvenMonthAdjusted(date)+"'>"+monthTitleOrEmpty(date)+"</div>"
      text += renderWeek(moment(date).subtract(1, 'days'))+"</div>"
      date.add(1, 'weeks')
      return text
    }).join(""))
  }

  function renderWeek(date) {
    return Array.apply(null, {length: 7}).map(function(it, idx) {
      date.add(1, 'days')
      var classes = ['day', oddOrEven(date)]
      if (isHoliday(date)) { classes.push("holiday") }
      if (state.dueDate == formatDateDesignator(date)) { classes.push("due-date") }
      return "<div class='"+ classes.join(" ") +"' data-date='"+formatDateDesignator(date)+"'>"+formatDayStr(date)+"</div>"
    }).join("")
  }

  function createInfoView() {
    var nodes = [
      "<h3>Due date: "+(state.dueDate || "")+"</h3>"
    ]
    return $(nodes.join(""))
  }

  function oddOrEven(date) {
    return date.month() % 2 == 0 ? "even" : "odd"
  }

  function oddOrEvenMonthAdjusted(date) {
    return date.month() % 2 == 0 && date.weekday() == 0 ? "even" : "odd"
  }

  function monthTitleOrEmpty(date) {
    return date.date() < 8 ? date.format("MMMM YYYY") : ""
  }

  function formatDayStr(date) {
    return "" + date.date()
  }

  function isHoliday(date) {
    return holidays[formatDateDesignator(date)]
  }

  function formatDateDesignator(date) {
    return date.format("DD-MM-YYYY")
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
    reRender()
  }

  function isDueDate(dateDesignator) {
    return dateDesignator === state.dueDate
  }

  function clearDueDate() {
    state.dueDate = null
    reRender()
  }



  var holidays = {
    "01-01-2016": "Uudenvuodenpäivä",
    "06-01-2016": "Loppiainen",
    "31-01-2016": "Kynttilänpäivä",
    "07-02-2016": "Laskiaissunnuntai",
    "13-03-2016": "Marian ilmestyspäivä",
    "20-03-2016": "Palmusunnuntai",
    "25-03-2016": "Pitkäperjantai",
    "27-03-2016": "Pääsiäissunnuntai",
    "28-03-2016": "Toinen pääsiäispäivä",
    "01-05-2016": "Vappu",
    "05-05-2016": "Helatorstai",
    "15-05-2016": "Helluntai",
    "15-05-2016": "Kaatuneiden muistopäivä",
    "22-05-2016": "Pyhän Kolminaisuuden päivä",
    "25-06-2016": "Juhannus",
    "26-06-2016": "Apostolien päivä",
    "10-07-2016": "Kirkastussunnuntai",
    "02-10-2016": "Mikkelinpäivä",
    "05-11-2016": "Pyhäinpäivä",
    "20-11-2016": "Tuomiosunnuntai",
    "06-12-2016": "Suomen itsenäisyyspäivä",
    "25-12-2016": "Joulupäivä",
    "26-12-2016": "Tapaninpäivä",
    "01-01-2017" : "Uudenvuodenpäivä",
    "06-01-2017" : "Loppiainen",
    "05-02-2017" : "Kynttilänpäivä",
    "26-02-2017" : "Laskiaissunnuntai",
    "26-03-2017" : "Marian ilmestyspäivä",
    "09-04-2017" : "Palmusunnuntai",
    "14-04-2017" : "Pitkäperjantai",
    "16-04-2017" : "Pääsiäissunnuntai",
    "17-04-2017" : "Toinen pääsiäispäivä",
    "01-05-2017" : "Vappu",
    "21-05-2017" : "Kaatuneiden muistopäivä",
    "25-05-2017" : "Helatorstai",
    "04-06-2017" : "Helluntai",
    "11-06-2017" : "Pyhän Kolminaisuuden päivä",
    "24-06-2017" : "Juhannus",
    "16-07-2017" : "Apostolien päivä",
    "30-07-2017" : "Kirkastussunnuntai",
    "01-10-2017" : "Mikkelinpäivä",
    "04-11-2017" : "Pyhäinpäivä",
    "26-11-2017" : "Tuomiosunnuntai",
    "06-12-2017" : "Suomen itsenäisyyspäivä",
    "25-12-2017" : "Joulupäivä",
    "26-12-2017" : "Tapaninpäivä",
    "01-01-2018" : "Uudenvuodenpäivä",
    "06-01-2018" : "Loppiainen",
    "04-02-2018" : "Kynttilänpäivä",
    "11-02-2018" : "Laskiaissunnuntai",
    "18-03-2018" : "Marian ilmestyspäivä",
    "25-03-2018" : "Palmusunnuntai",
    "30-03-2018" : "Pitkäperjantai",
    "01-04-2018" : "Pääsiäissunnuntai",
    "02-04-2018" : "Toinen pääsiäispäivä",
    "01-05-2018" : "Vappu",
    "10-05-2018" : "Helatorstai",
    "20-05-2018" : "Helluntai",
    "20-05-2018" : "Kaatuneiden muistopäivä",
    "27-05-2018" : "Pyhän Kolminaisuuden päivä",
    "23-06-2018" : "Juhannus",
    "01-07-2018" : "Apostolien päivä",
    "15-07-2018" : "Kirkastussunnuntai",
    "30-09-2018" : "Mikkelinpäivä",
    "03-11-2018" : "Pyhäinpäivä",
    "25-11-2018" : "Tuomiosunnuntai",
    "06-12-2018" : "Suomen itsenäisyyspäivä",
    "25-12-2018" : "Joulupäivä",
    "26-12-2018" : "Tapaninpäivä",
    "01-01-2019" : "Uudenvuodenpäivä",
    "06-01-2019" : "Loppiainen",
    "03-02-2019" : "Kynttilänpäivä",
    "03-03-2019" : "Laskiaissunnuntai",
    "24-03-2019" : "Marian ilmestyspäivä",
    "14-04-2019" : "Palmusunnuntai",
    "19-04-2019" : "Pitkäperjantai",
    "21-04-2019" : "Pääsiäissunnuntai",
    "22-04-2019" : "Toinen pääsiäispäivä",
    "01-05-2019" : "Vappu",
    "19-05-2019" : "Kaatuneiden muistopäivä",
    "30-05-2019" : "Helatorstai",
    "09-06-2019" : "Helluntai",
    "16-06-2019" : "Pyhän Kolminaisuuden päivä",
    "22-06-2019" : "Juhannus",
    "21-07-2019" : "Apostolien päivä",
    "04-08-2019" : "Kirkastussunnuntai",
    "29-09-2019" : "Mikkelinpäivä",
    "02-11-2019" : "Pyhäinpäivä",
    "24-11-2019" : "Tuomiosunnuntai",
    "06-12-2019" : "Suomen itsenäisyyspäivä",
    "25-12-2019" : "Joulupäivä",
    "26-12-2019" : "Tapaninpäivä",
    "01-01-2020" : "Uudenvuodenpäivä",
    "06-01-2020" : "Loppiainen",
    "02-02-2020" : "Kynttilänpäivä",
    "23-02-2020" : "Laskiaissunnuntai",
    "22-03-2020" : "Marian ilmestyspäivä",
    "05-04-2020" : "Palmusunnuntai",
    "10-04-2020" : "Pitkäperjantai",
    "12-04-2020" : "Pääsiäissunnuntai",
    "13-04-2020" : "Toinen pääsiäispäivä",
    "01-05-2020" : "Vappu",
    "17-05-2020" : "Kaatuneiden muistopäivä",
    "21-05-2020" : "Helatorstai",
    "31-05-2020" : "Helluntai",
    "07-06-2020" : "Pyhän Kolminaisuuden päivä",
    "20-06-2020" : "Juhannus",
    "12-07-2020" : "Apostolien päivä",
    "26-07-2020" : "Kirkastussunnuntai",
    "04-10-2020" : "Mikkelinpäivä",
    "31-10-2020" : "Pyhäinpäivä",
    "22-11-2020" : "Tuomiosunnuntai",
    "06-12-2020" : "Suomen itsenäisyyspäivä",
    "25-12-2020" : "Joulupäivä",
    "26-12-2020" : "Tapaninpäivä",
  }

  reRender()

})
