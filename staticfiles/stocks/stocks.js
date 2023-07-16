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
      // getPrices();
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

async function show_company(compName) {
  updateBrowserHistory(`/company/${compName}`);
  document.querySelector("#portfolio-view").style.display = "none";
  document.querySelector("#summary-row-top").style.display = "none";
  document.querySelector("#company-view").style.display = "block";
  if (userLoggedIn())
    document.querySelector("#history-view").style.display = "none";

  blurAllFields(true);
  const response = await fetch(`/companies/${compName}`);
  const result = await response.json();
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

function fillFinParams(result) {
  const roe = result.comp?.roe * 100;
  const divYield = (result.comp?.dividends / result.comp?.price) * 100;
  const marg = result.comp?.profitMargins * 100;
  document.querySelector("#company-pe").innerHTML =
    result.comp?.pe?.toFixed(1) || "???";
  document.querySelector("#company-fpe").innerHTML =
    result.comp?.fpe?.toFixed(1) || "???";
  document.querySelector("#company-pb").innerHTML =
    result.comp?.pb?.toFixed(1) || "???";
  document.querySelector("#company-roe").innerHTML = roe?.toFixed(1) || "???";
  document.querySelector("#company-debt").innerHTML =
    result.comp?.debt?.toFixed(2) || "???";
  document.querySelector("#company-profitMargins").innerHTML =
    marg?.toFixed(1) || "???";
  document.querySelector("#company-dividends").innerHTML =
    result.comp?.dividends?.toFixed(2) || "???";
  document.querySelector("#company-dividends-yield").innerHTML =
    divYield?.toFixed(1) || "???";
  if (userLoggedIn())
    document
      .querySelector(".big-green-btn")
      .addEventListener("click", showBuyForm);
}

function showBuyForm() {
  const buyForm = document.querySelector("#hidden-buy-form");
  document.querySelector(".big-green-btn").style.display = "none";
  buyForm.style.display = "block";
  buyForm.style.animationPlayState = "running";
}

// ----------------------------------------------------------------------
function showingHistory() {
  document.querySelector("#portfolio-view").style.display = "none";
  document.querySelector("#summary-row-top").style.display = "flex";
  document.querySelector("#history-view").style.display = "block";
  document.querySelector("#company-view").style.display = "none";

  let HistRows = document.querySelectorAll(".hist-row");
  HistRows.forEach((Row) => {
    changeHistRow(Row);
    // change div title when clicked
    const divCell = Row.querySelector(".div-title");
    divCell?.addEventListener("click", () => changeDivName(Row));
  });
  updateBrowserHistory("/history");
}

function changeHistRow(Row) {
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
      const profitCell = Row.querySelector("#hist-profit");
      const sellCell = Row.querySelector(".hist-sell");
      Row.querySelector(".hist-buy").innerHTML = "-";
      Row.querySelector(".hist-amount").innerHTML = "-";
      Row.querySelector(".hist-price").innerHTML = "-";
      profitCell.innerHTML = sellCell.innerHTML;
      profitCell.style.color = "rgba(78, 235, 0, 0.908)";
      sellCell.innerHTML = "-";
      Row.style.backgroundColor = "rgba(255, 205, 4, 0.165)";
      break;
    default:
      console.log("Incorrect action!");
  }
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

async function getDividend(event) {
  event.preventDefault();
  const title = document.querySelector("#Div-title").value;
  const amount = document.querySelector("#Div-amount").value.toString();
  // add dividend to the DB
  const response = await fetch(`/history/dividend`, {
    method: "PUT",
    body: JSON.stringify({
      title: title,
      amount: amount,
    }),
  });
  const data = await response.json();
  const newEntryId = data.id;
  const HistRow = createNewHistRow(title, amount);
  makeDivCellChangable(HistRow, newEntryId);
  updateProfits(amount);
  document.getElementById("Div-form").reset();
  ShowMessage("Dividends received");
}

function createNewHistRow(title, amount) {
  const HistRow = document.querySelector("#HistTable").insertRow(0);
  HistRow.className = "hist-row new-hist-row";
  HistRow.style.backgroundColor = "rgba(255, 205, 4, 0.165)";
  const cells = [];
  const content = ["DIV", `${title}`, "Div", "-", "-", "-", "-", `${amount}`];
  for (let [k, item] of content.entries()) {
    cells[k] = HistRow.insertCell(k);
    cells[k].innerHTML = item;
  }
  cells[7].className = "green-text";
  cells[0].className = "mobile-hide";
  cells[2].className = "mobile-hide";
  HistRow.style.animationPlayState = "running";
  return HistRow;
}

function updateProfits(amount) {
  const valuesToChange = document
    .querySelector("#profit-main")
    .querySelectorAll(".sum-value");
  valuesToChange.forEach((value) => {
    let profitValue = parseInt(
      value.innerHTML.replace("$", "").replaceAll(" ", "")
    );
    let newValue = profitValue + Math.round(Number(amount));
    value.innerHTML = moneyFormat(newValue);
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
  let sum1 = 0,
    sum2 = 0,
    dayCh = 0;
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
  // console.time("sortTable");
  const whichSort = tar.className;
  const table = document.getElementById("mainTable").querySelector("tbody");
  const rows = table.rows;
  const crit = determineSortParameter(whichSort);
  const rowMap = new Map();
  for (let [i, row] of Array.from(table.rows).entries()) {
    const param = Number(
      row.querySelector(crit)?.innerHTML.replaceAll(" ", "").replace("%", "")
    );
    rowMap.set(param, row);
  }
  const sortedArray = Array.from(rowMap);
  sortedArray.sort((a, b) =>
    whichSort.includes("Up") ? b[0] - a[0] : a[0] - b[0]
  );
  const sortedMap = new Map(sortedArray);
  let index = 0;
  for (let [_, row] of sortedMap) {
    const parent = row.parentNode;
    parent.removeChild(row);
    const targetRow = rows[index];
    parent.insertBefore(row, targetRow);
    index++;
  }
  // switch classes after sorting in the main table
  if (whichSort.includes("Up")) tar.classList.replace("Up", "Down");
  else tar.classList.replace("Down", "Up");
  // console.timeEnd("sortTable");
}

function determineSortParameter(whichSort) {
  let crit;
  if (whichSort.includes("sortSigma")) crit = ".sigma-row";
  else if (whichSort.includes("sortChange")) crit = "#change-field";
  else if (whichSort.includes("sortDay")) crit = "#day-one";
  return crit;
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
  updateBtn.addEventListener("mouseup", async function () {
    updateBtn.style.display = "none";
    document.querySelector(".three-dots").style.display = "flex";
    await getPrices();
    removeThreeDots();
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

async function getPrices() {
  const table = document.getElementById("mainTable").querySelector("tbody");
  const rows = [...table.rows];
  let tickList = [];
  let tickStr = "";
  for (let [i, row] of rows.entries()) {
    const ticker = row.querySelector("#company-ticker").innerHTML;
    tickList.push(ticker);
    tickStr = tickList.join(",");
  }
  const APIkey = "a2e01fe80641a6a4c5f2d5cf985f2c18";
  let url = `https://financialmodelingprep.com/api/v3/quote/${tickStr}?apikey=${APIkey}`;
  const response = await fetch(url);
  const data = await response.json();
  console.log(data);

  for (let [_, row] of rows.entries()) {
    const ticker = row.querySelector("#company-ticker").innerHTML;
    const day = row.querySelector("#day-one");
    const myPrice = Number(row.querySelector(".my-price-row").innerHTML);
    const quan = Number(row.querySelector(".quantity-row").innerHTML);
    const price = row.querySelector(".market-price");
    const sigma = row.querySelector(".sigma-row");
    const change = row.querySelector("#change-field");
    for (let item of data) {
      if (item.symbol === ticker) {
        const priceToday = quan * item.price;
        const priceOrig = quan * myPrice;
        day.innerHTML = `${item.changesPercentage.toFixed(2)} %`;
        price.innerHTML = item.price.toFixed(2);
        sigma.innerHTML = priceToday.toFixed(2);
        const chNum = ((priceToday / priceOrig - 1) * 100).toFixed(2);
        change.innerHTML = `${chNum} %`;
        const animateList = [price, sigma, change, day];
        for (let elem of animateList) elem.classList.add("animate");
        setTimeout(function () {
          price.className = "market-price";
          sigma.className = "sigma-row";
          change.className = RedGreenText(chNum);
          day.className = RedGreenText(item.changesPercentage);
        }, 1500);
        break;
      }
    }
  }
  if (userLoggedIn()) fillTopInfo();
}
