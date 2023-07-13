"use strict";
document.addEventListener("DOMContentLoaded", () => {
  checkMessages();
  AuthCheck()
    .then((answer) => localStorage.setItem("loggedIn", answer))
    .then(() => {
      if (userLoggedIn()) {
        fillTopInfo();
        activateDivForm();
      }
      loadCorrectView();
      searchFormFunction();
      updateBtnFunction();
      capitalizeName();
      document.addEventListener("click", (event) => handleClicks(event));
      // browser back button action
      window.addEventListener("popstate", loadCorrectView);
    });
});

function handleClicks(event) {
  const tar = event.target;
  // show a view
  showingCompany(tar);
  if (tar.className.includes("portfolio-btn")) showingMain();
  if (tar.className.includes("history-btn")) showingHistory();
  // or sort main table
  if (tar.className.includes("Up") || tar.className.includes("Down"))
    sortTable(tar);
}

function searchFormFunction() {
  // if company is searched - make Search field clickable and Buy button appear
  const filledSearchForm = document.querySelector("#check-filled");
  if (filledSearchForm !== null) {
    if (filledSearchForm.innerHTML !== "") showActionBtns();
    document
      .querySelector("#main-view-search")
      .addEventListener("click", beginSearch);
  }
}

function showActionBtns() {
  const seBox = document.querySelectorAll(".ticker-search-box");
  seBox.forEach((box) => box.classList.add("ticker-link"));
  document
    .querySelector(".ticker-search-container")
    .classList.add("ticker-link");
  if (userLoggedIn())
    document.getElementById("action-buttons").style.animationPlayState =
      "running";
}

function beginSearch() {
  if (document.querySelector(".ticker-inp").value != "") {
    document.querySelector("#main-view-search").value = "Loading..";
    document.querySelector(".loader").classList.remove("hidden");
    const innerBoxes = document.querySelectorAll(".ticker-search-box");
    innerBoxes.forEach((item) => (item.style.filter = "blur(3px)"));
  }
}
// ----------------------------------------------------------------------

function showingMain() {
  updateBrowserHistory("/");
  document.querySelector("#company-view").style.display = "none";
  document.querySelector("#portfolio-view").style.display = "block";
  document.querySelector("#summary-row-top").style.display = "flex";
  if (userLoggedIn()) {
    document.querySelector("#history-view").style.display = "none";
  }
}

function showingCompany(tar) {
  let clName = tar.parentElement?.className;
  let compName;
  if (clName.includes("hist-row")) compName = showComp_history(tar);
  if (clName.includes("table-row")) compName = showComp_main(tar);
  if (tar.className.includes("companies-btn")) compName = showComp_link();
  if (tar.parentElement.parentElement.className.includes("ticker-link"))
    compName = document.querySelector("#hidden-ticker").value;
  if (tar.className.includes("comp-search-btn"))
    compName = showComp_CompSearch();

  compName && show_company(compName);
}

function showComp_history(tar) {
  if (tar.parentElement.querySelector(".hist-action").innerHTML != "Div")
    return tar.parentElement.querySelector("#hist-company-name").innerHTML;
}

const showComp_main = (tar) =>
  tar.parentElement.querySelector("#company-ticker").innerHTML;

function showComp_link() {
  if (userLoggedIn()) {
    document.querySelector("#hidden-buy-form").style.display = "none";
    document.querySelector(".big-green-btn").style.display = "block";
  }
  return "random";
}

function showComp_CompSearch() {
  const compName = document.querySelector("#comp-search").value.toUpperCase();
  document.querySelector("#comp-search").value = "";
  document.querySelector("#hidden-buy-form").style.display = "none";
  if (userLoggedIn())
    document.querySelector(".big-green-btn").style.display = "block";
  return compName;
}

function show_company(compName) {
  updateBrowserHistory(`/company/${compName}`);
  document.querySelector("#portfolio-view").style.display = "none";
  document.querySelector("#summary-row-top").style.display = "none";
  document.querySelector("#company-view").style.display = "block";
  if (userLoggedIn())
    document.querySelector("#history-view").style.display = "none";

  blurAllFields(true);
  fetch(`/companies/${compName}`)
    .then((response) => response.json())
    .then((result) => {
      if (result.message) {
        ShowMessage(result.message);
        blurAllFields(false);
        return false;
      }
      comp_fillName(result);
      comp_fillPrice(result);
      comp_fillTarget(result);
      comp_fillDesc(result);
      comp_fillRecom(result);
      fillFinParams(result);
      blurAllFields(false);
    });
}

function comp_fillPrice(result) {
  document.querySelector("#res-comp-price").innerHTML = `$ ${
    result.comp?.price?.toFixed(2) || "???"
  }`;
  const resComDay = document.querySelector("#res-comp-day");
  const valuePer = result.comp?.day?.toFixed(1);
  resComDay.innerHTML = `${valuePer || "???"} % `;
  resComDay.className = `med-text ${RedGreenText(valuePer)}`;
}
function comp_fillTarget(result) {
  let potential =
    (result.comp?.targetPrice / result.comp?.price - 1) * 100 ?? 0;
  document.querySelector("#comp-target-dol").innerHTML = `$ ${
    result.comp?.targetPrice?.toFixed(2) || "???"
  }`;
  const targPer = document.querySelector("#comp-target-per");
  targPer.innerHTML = `${potential.toFixed(1)} %`;
  targPer.classList.add(RedGreenText(potential));
}
function comp_fillName(result) {
  document.querySelector("#company-title").innerHTML = `${MakeCapitalized(
    result.comp?.company
  )}`;
  document.querySelector("#comp-ticker").innerHTML = result.comp?.ticker;
  document.querySelector("#hidden-ticker-comp").value = result.comp?.ticker;
}
const comp_fillRecom = (result) =>
  (document.querySelector("#company-recom").innerHTML =
    result.comp?.recom || "???");

function comp_fillDesc(result) {
  const fullText = result.comp?.desc || "no description";
  const desc = document.querySelector("#company-desc");
  desc.innerHTML = truncate(fullText, 600);
  let collapsed = true;
  desc.addEventListener("click", () => {
    if (collapsed) {
      desc.innerHTML = fullText;
      collapsed = false;
    } else {
      desc.innerHTML = truncate(fullText, 600);
      collapsed = true;
    }
  });
}

// todo - html
function fillFinParams(result) {
  const roe = result.comp?.roe * 100;
  const divYield = (result.comp?.dividends / result.comp?.price) * 100;
  const marg = result.comp?.profitMargins * 100;
  try {
    const part1 = '<div class="comp-param-text">';
    const part2 = '</div> <div class="comp-param-value">';
    document.querySelector("#company-pe").innerHTML = `${part1} PE: ${part2} ${
      result.comp?.pe?.toFixed(1) || "???"
    } </div>`;
    document.querySelector(
      "#company-fpe"
    ).innerHTML = `${part1} Forward PE: ${part2} ${
      result.comp?.fpe?.toFixed(1) || "???"
    }</div>`;
    document.querySelector("#company-pb").innerHTML = `${part1} PB: ${part2} ${
      result.comp?.pb?.toFixed(1) || "???"
    }</div>`;
    document.querySelector(
      "#company-roe"
    ).innerHTML = `${part1} ROE: ${part2} ${roe?.toFixed(1) || "???"} %</div>`;
    document.querySelector(
      "#company-debt"
    ).innerHTML = `${part1} Debt to Equity: ${part2} ${
      result.comp?.debt?.toFixed(2) || "???"
    }</div>`;
    document.querySelector(
      "#company-profitMargins"
    ).innerHTML = `${part1} Profit Margins: ${part2} ${
      marg?.toFixed(1) || "???"
    } %</div>`;
    document.querySelector(
      "#company-dividends"
    ).innerHTML = `${part1} Dividends: ${part2} $ ${
      result.comp?.dividends?.toFixed(2) || "???"
    }</div>`;
    document.querySelector(
      "#company-dividends-yield"
    ).innerHTML = `${part1} Dividends yield: ${part2}  ${
      divYield?.toFixed(1) || "???"
    } %</div>`;
    if (userLoggedIn()) {
      document.querySelector(".big-green-btn").addEventListener("click", () => {
        document.querySelector("#hidden-buy-form").style.display = "block";
        document.querySelector(".big-green-btn").style.display = "none";
        document.querySelector("#hidden-buy-form").style.animationPlayState =
          "running";
      });
    }
  } catch (error) {
    console.error(error);
  }
}

// ----------------------------------------------------------------------
function showingHistory() {
  document.querySelector("#portfolio-view").style.display = "none";
  document.querySelector("#summary-row-top").style.display = "flex";
  document.querySelector("#history-view").style.display = "block";
  document.querySelector("#company-view").style.display = "none";

  let HistRows = document.querySelectorAll(".hist-row");
  HistRows.forEach((Row) => {
    let action = Row.querySelector(".hist-action").innerHTML;
    // switch statement as an if-else alternative
    switch (action) {
      case "Buy":
        Row.querySelector(".hist-sell").innerHTML = "-";
        break;
      case "Sell":
        Row.querySelector(".hist-buy").innerHTML = "-";
        Row.style.backgroundColor = "rgba(126, 21, 218, 0.08)";
        break;
      case "Div":
        Row.querySelector(".hist-buy").innerHTML = "-";
        Row.querySelector(".hist-amount").innerHTML = "-";
        Row.querySelector(".hist-price").innerHTML = "-";
        Row.querySelector("#hist-profit").innerHTML =
          Row.querySelector(".hist-sell").innerHTML;
        Row.querySelector("#hist-profit").style.color =
          "rgba(78, 235, 0, 0.908)";
        Row.querySelector(".hist-sell").innerHTML = "-";
        Row.style.backgroundColor = "rgba(255, 205, 4, 0.165)";
        break;
      default:
        console.log("Incorrect action!");
    }
    // if dividend title is clicked - change div title
    Row.addEventListener("click", (event) => {
      const tar2 = event.target;
      if (tar2.className.includes("div-title")) changeDivName(Row);
    });
  });
  updateBrowserHistory("/history");
}

function changeDivName(Row) {
  const NormTitle = Row.querySelector(".div-title");
  const ChangedTitle = Row.querySelector("#change-title-cell");
  const changeBtn = Row.querySelector("#div-title-change-btn");
  NormTitle.style.display = "none";
  ChangedTitle.style.display = "block";
  changeBtn.addEventListener("click", () => {
    const newTitle = Row.querySelector("#change-title").value;
    const ident = Row.querySelector("#hidden-hist-id").value;
    fetch(`/change/${ident}/${newTitle}`);
    // todo - check if fetch was successful
    NormTitle.style.display = "block";
    NormTitle.innerHTML = newTitle;
    ChangedTitle.style.display = "none";
    ShowMessage("Entry modified");
  });
}
const activateDivForm = () =>
  document.getElementById("Div-form").addEventListener("submit", getDividend);

function getDividend(event) {
  event.preventDefault();
  const form = document.getElementById("Div-form");
  const title = document.querySelector("#Div-title").value;
  const amount = document.querySelector("#Div-amount").value.toString();
  // make a call to backend to add this dividend to the DB
  let newEntryId;
  fetch(`/history/dividend`, {
    method: "PUT",
    body: JSON.stringify({
      title: title,
      amount: amount,
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      newEntryId = data.id;
      // creatig new row for new dividend entry on the 1st position of the table
      const HistRow = document.querySelector("#HistTable").insertRow(0);
      HistRow.className = "hist-row new-hist-row";
      HistRow.style.backgroundColor = "rgba(255, 205, 4, 0.165)";

      const cells = [];
      const content = [
        "DIV",
        `${title}`,
        "Div",
        "-",
        "-",
        "-",
        "-",
        `${amount}`,
      ];
      for (let k = 0; k < 8; k++) {
        cells[k] = HistRow.insertCell(k);
        cells[k].innerHTML = content[k];
      }
      // todo - stop hardcoding
      cells[7].className = "green-text";
      cells[0].className = "mobile-hide";
      cells[2].className = "mobile-hide";
      makeDivCellChangable(HistRow, newEntryId);
      HistRow.style.animationPlayState = "running";

      // update profit value
      const valuesToChange = document
        .querySelector("#profit-main")
        .querySelectorAll(".sum-value");
      // get rid of space and $ sign
      valuesToChange.forEach((value) => {
        let profitValue = parseInt(
          value.innerHTML.replace(/[^0-9-]+/g, ""),
          10
        );
        let newValue = profitValue + Math.round(Number(amount));
        value.innerHTML = moneyFormat(newValue);
      });

      form.reset();
      ShowMessage("Dividends received");
    });
}

function makeDivCellChangable(HistRow, newEntryId) {
  HistRow.cells[1].className = "div-title";
  const techCell = HistRow.insertCell(2);
  techCell.id = "change-title-cell";
  techCell.innerHTML = `
        <div class="flex-container">
            <input class='ticker-inp long' type="text" id="change-title" value="${HistRow.cells[1].innerHTML}">
            <input id="div-title-change-btn" class="div-btn" type="submit" value="Change">
            <input id="hidden-hist-id" type="hidden" value="${newEntryId}">
        </div>
  `;
  HistRow.cells[1].addEventListener("click", () => {
    changeDivName(HistRow);
  });
}

// ----------------------------------------------------------------------
function fillTopInfo() {
  const rows = document.querySelectorAll(".table-row");

  let [sum1, sum2, dayCh] = calculateMainParameters(rows);
  let [nowChange, perChange] = calculateSecParameters(sum1, sum2, dayCh);

  fillMainBlock(sum1);
  fillChangeBlock("#nowChange", sum2, nowChange);
  fillChangeBlock("#dayChange", dayCh, perChange);
  fillEarnProfit(sum1, sum2);
}

function calculateMainParameters(rows) {
  let sum1 = 0;
  let sum2 = 0;
  let dayCh = 0;
  rows.forEach((row) => {
    let dayOne;
    let myPr = parseFloat(row.querySelector(".my-price-row").innerHTML);
    let Qu = parseFloat(row.querySelector(".quantity-row").innerHTML);
    let Si = parseFloat(row.querySelector(".sigma-row").innerHTML);
    sum1 += myPr * Qu; // money originally paid for all stocks
    sum2 += Si; // actual money in stocks now
    dayOne = parseFloat(row.querySelector("#day-one").innerHTML) || 0;
    dayCh += (Si * dayOne) / 100; // day change in dollars for every stock combined
  });
  dayCh = Number(dayCh.toFixed());
  sum1 = Number(parseFloat(sum1).toFixed());
  sum2 = Number(parseFloat(sum2).toFixed());
  return [sum1, sum2, dayCh];
}

function calculateSecParameters(sum1, sum2, dayCh) {
  let nowChange = Number(((sum2 / sum1 - 1) * 100).toFixed(2)) || 0;
  let perChange = Number(((dayCh / sum2) * 100).toFixed(2)) || 0;
  return [nowChange, perChange];
}

function fillChangeBlock(where, value1, value2) {
  const moneyBlock = document.querySelector(`${where}Dol`);
  const percentBlock = document.querySelector(`${where}Per`);
  const colorClass = RedGreenText(value2);
  moneyBlock.classList.add(colorClass);
  percentBlock.classList.add(colorClass);
  moneyBlock.innerHTML = moneyFormat(value1);
  percentBlock.innerHTML = `${value2} %`;
}

function fillEarnProfit(sum1, sum2) {
  const earnElem = document.querySelector("#earnings");
  let earnings = Number(
    earnElem.innerHTML.replaceAll(" ", "").replace("$", "")
  );
  earnElem.innerHTML = moneyFormat(earnings);

  let prof = sum2 - sum1 + earnings;
  const profitBox = document.querySelector("#profit");
  profitBox.className = `sum-value ${RedGreenText(prof)}`;
  profitBox.innerHTML = moneyFormat(prof);
}

function fillMainBlock(sum1) {
  document
    .querySelector("#invested-main")
    .querySelector(".sum-value").innerHTML = moneyFormat(sum1);
}

// ----------------------------------------------------------------------
function sortTable(tar) {
  const whichSort = tar.className;
  const table = document.getElementById("mainTable");
  let switching = true;
  let shouldSwitch, i;

  while (switching) {
    switching = false;
    const rows = table.rows;
    let rowLen = rows.length;
    for (i = 1; i < rowLen - 1; i++) {
      shouldSwitch = false;
      let [x, y] = determineSortParameter(whichSort, rows, i);

      // * direction determination
      // whichSort.includes("Up") ? parseFloat(x) < parseFloat(y) : parseFloat(x) < parseFloat(y);
      if (whichSort.includes("Up")) {
        if (parseFloat(x) < parseFloat(y)) {
          shouldSwitch = true;
          break;
        }
      } else if (whichSort.includes("Down")) {
        if (parseFloat(x) > parseFloat(y)) {
          shouldSwitch = true;
          break;
        }
      }
    }
    if (shouldSwitch) {
      rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
      switching = true;
    }
  }
  // * switch classes after sorting in the main table
  if (whichSort.includes("Up")) tar.classList.replace("Up", "Down");
  else tar.classList.replace("Down", "Up");
}

function determineSortParameter(whichSort, rows, i) {
  let x, y;
  if (whichSort.includes("sortSigma")) {
    x = rows[i].querySelector(".sigma-row").innerHTML;
    y = rows[i + 1].querySelector(".sigma-row").innerHTML;
  } else if (whichSort.includes("sortChange")) {
    x = rows[i].querySelector("#change-field").innerHTML;
    y = rows[i + 1].querySelector("#change-field").innerHTML;
  } else if (whichSort.includes("sortDay")) {
    let value = rows[i].querySelector("#day-one").innerHTML;
    x = value == "" ? -100 : value;
    y = rows[i + 1].querySelector("#day-one").innerHTML;
  }
  return [x, y];
}
// ----------------------------------------------------------------------
function updateBtnFunction() {
  const updateBtn = document.querySelector(".prices-btn");
  updateBtn.addEventListener("mouseover", function () {
    updateBtn.textContent = "Update";
  });
  updateBtn.addEventListener("mouseout", function () {
    updateBtn.textContent = "Price, $";
  });
  updateBtn.addEventListener("mouseup", function () {
    updateBtn.style.display = "none";
    document.querySelector(".three-dots").style.display = "flex";
  });
  updateBtn.onclick = () => updatePrices();
}

function updatePrices() {
  const rows = document.querySelectorAll(".table-row");
  let rowCount = 0;
  rows.forEach((row) => {
    let ticker = row.querySelector("#company-ticker").innerHTML;
    getData(ticker)
      .then((data) => {
        changeRowValues(row, data);
      })
      .then(() => {
        rowCount++;
        if (rowCount === rows.length) {
          setTimeout(function () {
            if (userLoggedIn()) fillTopInfo();
            removeThreeDots();
          }, 400);
        }
      })
      .catch((error) => {
        removeThreeDots();
        console.error(error);
      });
  });
}

async function getData(ticker) {
  const dbData = await fetch(`companies/${ticker}`);
  const compData = await dbData.json();
  return compData;
}

function changeRowValues(row, data) {
  const day = row.querySelector("#day-one");
  const price = row.querySelector(".market-price");
  const sigma = row.querySelector(".sigma-row");
  const change = row.querySelector("#change-field");
  const myPrice = Number(row.querySelector(".my-price-row").innerHTML);
  const quant = Number(row.querySelector(".quantity-row").innerHTML);

  day.innerHTML = data.comp?.day?.toFixed(2) || "";
  day.innerHTML = day.innerHTML && day.innerHTML + " %";

  const stockPrice = data.comp?.price;
  price.innerHTML =
    stockPrice < 0.01 ? stockPrice.toExponential(2) : stockPrice.toFixed(2);

  let sigNum = quant * stockPrice;
  sigma.innerHTML = sigNum.toFixed(2);
  let chNum = (stockPrice / myPrice - 1) * 100;
  change.innerHTML = `${chNum.toFixed(2)} %`;
  price.classList.add("animate");
  sigma.classList.add("animate");
  change.classList.add("animate");
  day.classList.add("animate");
  setTimeout(function () {
    price.className = "market-price";
    change.className = RedGreenText(chNum);
    day.className = RedGreenText(data.comp.day);
    sigma.className = "sigma-row";
  }, 1500);
  return true;
}

function removeThreeDots() {
  const updateBtn = document.querySelector(".prices-btn");
  updateBtn.style.display = "block";
  document.querySelector(".three-dots").style.display = "none";
}
// ----------------------------------------------------------------------

function moneyFormat(string) {
  let changed = string + "";
  if (3 < changed.length && changed.length < 7)
    changed = `${changed.slice(0, -3)} ${changed.slice(-3)}`;
  return `$ ${changed}`.padEnd(9);
}

function capitalizeName() {
  if (userLoggedIn()) {
    const name = document.querySelector(".username");
    let myName = name.innerHTML;
    name.innerHTML = MakeCapitalized(myName);
  }
}
function MakeCapitalized(string) {
  const low = string.toLowerCase();
  // uppercase first letter
  let converted = low.at(0).toUpperCase() + low.slice(1);
  const separators = [" ", "&", "-"];
  let capitalized = "";
  let next;
  for (const char of converted) {
    if (next) {
      capitalized += char.toUpperCase();
      next = false;
    } else capitalized += char;
    if (separators.includes(char)) next = true;
  }
  return capitalized;
}

function truncate(string, length) {
  return string.length > length ? `${string.substr(0, length)}...` : string;
}

function checkMessages() {
  const message = document.querySelector("#message");
  if (message !== null) {
    ShowMessage(message.innerHTML);
  }
}
function ShowMessage(text) {
  let url = window.location.href;
  if (url.includes("company") || url.includes("history")) {
    const dialog = document.querySelector("#modal-messenger");
    dialog.showModal();
    const message = document.querySelector("#modal-message");
    message.innerHTML = text;
    setTimeout(() => {
      dialog.close();
    }, 2000);
  } else {
    const box = document.querySelector(".ticker-search-container");
    const messenger = document.querySelector(".messenger");
    messenger.innerHTML = text;
    messenger.classList.toggle("hidden");
    box.classList.toggle("box-shimmer");
    const innerBoxes = document.querySelectorAll(".ticker-search-box");
    innerBoxes.forEach((box) => {
      box.style.filter = "blur(8px)";
      setTimeout(() => {
        box.style.filter = "blur(0)";
      }, 2000);
    });
    setTimeout(() => {
      messenger.classList.toggle("hidden");
      box.classList.toggle("box-shimmer");
    }, 2000);
  }
}

function blurAllFields(bool) {
  if (bool) document.querySelector(".big-loader").classList.remove("hidden");
  else document.querySelector(".big-loader").classList.add("hidden");
  const blurList = [
    "#company-title",
    "#company-desc",
    ".company-price-row",
    "#hidden-buy-form",
    "#comp-ticker",
  ];
  for (const element of blurList) {
    document.querySelector(`${element}`).style.filter = bool
      ? "blur(5px)"
      : "blur(0)";
  }
  const sumRows = document.querySelectorAll(".summary-row");
  sumRows.forEach((item) => {
    item.style.filter = bool ? "blur(5px)" : "blur(0)";
  });
}

function loadCorrectView() {
  // The popstate event is fired each time when the current history entry changes.
  Timer("check");
  let url = window.location.href;
  if (url.slice(-7) === "history") {
    showingHistory();
  }
  if (url.slice(-1) === "/") {
    showingMain();
  }
  if (
    url.slice(-6) === "action" ||
    url.slice(-5) === "login" ||
    url.slice(-6) === "logout" ||
    url.slice(-8) === "register"
  ) {
    updateBrowserHistory("/");
  }
  if (url.includes("company")) {
    const location = url.indexOf("company");
    const company = url.slice(location + 8);
    show_company(company);
  }
}

async function AuthCheck() {
  let status;
  const resp = await fetch(`/authCheck`);
  const data = await resp.json();
  status = data.LoggedIn;
  return status;
}
const userLoggedIn = () => localStorage.getItem("loggedIn") === "true";

function Timer(action) {
  if (action == "stop") {
    localStorage.removeItem("countdown");
    return true;
  }
  let countdown;
  if (localStorage.getItem("countdown") !== null) {
    // localStorage is set in index.html
    countdown = localStorage.getItem("countdown");
  }
  const timer = document.getElementById("time");
  if (timer !== null && localStorage.getItem("countdown") !== null) {
    const update = setInterval(function () {
      let minutes = String(Math.trunc(countdown / 60));
      let seconds = String(countdown - minutes * 60);
      minutes = minutes < 10 ? `0${minutes}` : minutes;
      seconds = seconds < 10 ? `0${seconds}` : seconds;
      timer.innerHTML = `${minutes}:${seconds}`;
      countdown--;
      localStorage.setItem("countdown", countdown);
      if (countdown < 0) {
        clearInterval(update);
        localStorage.removeItem("countdown");
        fetch("/logout");
        ShowMessage("Logged out");
        setTimeout(() => {
          location.reload();
        }, 1500);
      }
    }, 1000);
  }
}

const updateBrowserHistory = (str) => window.history.pushState("_", "_", str);

const RedGreenText = (param) => (param < 0 ? "red-text" : "green-text");
