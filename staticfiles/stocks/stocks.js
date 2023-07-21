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

// -------------------------------------------------------------------------------------------------
function searchFormFunction() {
  const form = document.querySelector("#searchForm");
  const compName = form.querySelector("#searchForComp");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    compName != "" && mutateForm(true);
    fillFormWithData(compName.value);
    showActionBtns();
    document.querySelector("#searchForComp").value = "";
  });
}

function mutateForm(bool) {
  document.querySelector("#main-view-search").value = bool
    ? "Loading.."
    : "Search";
  document.querySelector(".loader").classList.toggle("hidden");
  const innerBoxes = document.querySelectorAll(".ticker-search-box");
  innerBoxes.forEach(
    (item) => (item.style.filter = bool ? "blur(8px)" : "blur(0px)")
  );
}

async function fillFormWithData(compName) {
  const name = document.querySelector("#search-display-name");
  const price = document.querySelector("#search-display-price");
  const PE = document.querySelector("#search-display-PE");
  const avPr200 = document.querySelector("#search-display-avPr200");
  const hidTicker = document.querySelector("#hidden-ticker");
  let data = await checkComp_US(compName);
  if (typeof data !== "string") {
    name.innerHTML = data.name;
    price.innerHTML = `$ ${data.price.toFixed(2)}`;
    PE.innerHTML = data.pe || "---";
    avPr200.innerHTML = ` $ ${data.priceAvg200?.toFixed(2) || "---"}`;
    hidTicker.value = data.symbol;
    mutateForm(false);
    sendStockToServer(data);
  } else {
    mutateForm(false);
    ShowMessage(data);
  }
}

function sendStockToServer(data) {
  fetch("dataHandler", {
    method: "POST",
    body: JSON.stringify({
      ticker: data.symbol,
      name: data.name,
      day: data.changesPercentage,
      price: data.price,
      market: data.exchange,
      eps: data.eps,
      pe: data.pe,
      priceAvg200: data.priceAvg200,
    }),
  });
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

// -------------------------------------------------------------------------------------------------
function showingMain() {
  updateBrowserHistory("/");
  updateAllPrices();
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
  document.querySelector("#portfolio-view").style.display = "none";
  document.querySelector("#summary-row-top").style.display = "none";
  document.querySelector("#company-view").style.display = "block";
  if (userLoggedIn())
    document.querySelector("#history-view").style.display = "none";
  blurAllFields(true);
  let data;

  compName !== "random"
    ? (data = await checkComp_US(compName))
    : (data = await getRandomComp());

  // if no such company:
  if (typeof data === "string") {
    ShowMessage(data);
    blurAllFields(false);
    return false;
  }
  comp_fillName(data);
  comp_fillPrice(data);
  comp_fillAvPr200(data);
  comp_fillRecom(data);
  await comp_fillDesc(data);
  if (data.market !== "MOEX") await fillFinParams(data);
  blurAllFields(false);
  updateBrowserHistory(`/company/${compName}`);
}

async function getRandomComp() {
  const response = await fetch("/DB/random");
  const data = await response.json();
  return data.comp;
}

function comp_fillName(data) {
  document.querySelector("#company-title").innerHTML = `${MakeCapitalized(
    data.name
  )}`;
  document.querySelector("#comp-ticker").innerHTML = data.symbol;
  document.querySelector("#hidden-ticker-comp").value = data.symbol;
}
function comp_fillPrice(data) {
  document.querySelector("#res-comp-price").innerHTML = `$ ${
    data.price.toFixed(2) || "???"
  }`;
  const resComDay = document.querySelector("#res-comp-day");
  const valuePer = data.changesPercentage?.toFixed(1);
  resComDay.innerHTML = `${valuePer || "???"} % `;
  resComDay.className = `med-text ${RedGreenText(valuePer)}`;
}
function comp_fillAvPr200(data) {
  let potential = (data.priceAvg200 / data.price - 1) * 100 ?? 0;
  document.querySelector("#comp-target-dol").innerHTML = `$ ${
    data.priceAvg200?.toFixed(2) || "???"
  }`;
  const targPer = document.querySelector("#comp-target-per");
  targPer.innerHTML = `${potential.toFixed(1)} %`;
  targPer.className = `med-text ${RedGreenText(potential)}`;
}

const comp_fillRecom = (data) =>
  (document.querySelector("#company-recom").innerHTML = data.eps || "???");

async function comp_fillDesc(data) {
  let fullText =
    data.desc ||
    (data.market !== "MOEX" && (await getDescription(data.symbol))) ||
    "No description";
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

async function getDescription(ticker) {
  const response = await fetch(`/DB/desc/${ticker}`);
  const data = await response.json();
  fillLogo(data.picture);
  return data.description;
}

function fillLogo(url) {
  // console.log(url);
  // it's possible to receive company logo, but it uses additional API call (from 5 in 1 min)
}

async function fillFinParams(data) {
  console.log(data);
  const ticker = data.symbol;
  console.log(ticker);
  // get financial parameters for this company
  const APIkey = "aa0e59ae3e34a1ace7188048088c0dc3"; //! await getKey();
  let url_params = `https://financialmodelingprep.com/api/v3/ratios/${ticker}?apikey=${APIkey}`;
  const response_params = await fetch(url_params);
  const finData = await response_params.json();
  const pe = finData[0].priceEarningsRatio?.toFixed(2);
  const fpe = finData[0].priceEarningsToGrowthRatio?.toFixed(2);
  const profMarg = finData[0].netProfitMargin?.toFixed(2);
  const divs = finData[0].dividendPayoutRatio?.toFixed(2);
  const debtToEq = finData[0].debtEquityRatio?.toFixed(2);
  const PB = finData[0].priceToBookRatio?.toFixed(2);
  const ROE = finData[0].returnOnEquity?.toFixed(2);
  // const fairPr = finData[0].priceFairValue.toFixed(2);
  const divYield = (divs / data.price) * 100;
  // const roe = data.roe * 100;
  // const marg = data.profitMargins * 100;
  document.querySelector("#company-pe").innerHTML = pe || "???";
  document.querySelector("#company-fpe").innerHTML = fpe || "???";
  document.querySelector("#company-pb").innerHTML = PB || "???";
  document.querySelector("#company-roe").innerHTML = `${ROE * 100} %` || "???";
  document.querySelector("#company-debt").innerHTML = debtToEq || "???";
  document.querySelector("#company-profitMargins").innerHTML =
    `${profMarg * 100} %` || "-";
  document.querySelector("#company-dividends").innerHTML = divs || "???";
  document.querySelector("#company-dividends-yield").innerHTML =
    `${divYield.toFixed(2)} %` || "-";
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

// -------------------------------------------------------------------------------------------------
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

// -------------------------------------------------------------------------------------------------
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
  moneyBlock.className = `sum-value ${colorClass}`;
  percentBlock.className = `sum-value ${colorClass}`;
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

// -------------------------------------------------------------------------------------------------
function sortTable(tar) {
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

// -------------------------------------------------------------------------------------------------
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
    // mutateForm(false);
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

// -------------------------------------------------------------------------------------------------
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
    await updateAllPrices();
    removeThreeDots();
  });
}

function removeThreeDots() {
  const updateBtn = document.querySelector(".prices-btn");
  updateBtn.style.display = "block";
  document.querySelector(".three-dots").style.display = "none";
}

async function updateAllPrices() {
  const table = document.getElementById("mainTable").querySelector("tbody");
  const rows = [...table.rows];
  let tickList = [];
  let tickList_rus = [];
  let tickStr = "";
  for (let [_, row] of rows.entries()) {
    const ticker = row.querySelector("#company-ticker").innerHTML;
    const market = row.querySelector("#company-market").innerHTML;
    if (market != "MOEX" && market != "XETRA") tickList.push(ticker);
    else if (market === "MOEX") tickList_rus.push(ticker);
  }
  tickStr = tickList.join(",");
  const APIkey = "aa0e59ae3e34a1ace7188048088c0dc3"; //await getKey();
  let url = `https://financialmodelingprep.com/api/v3/quote/${tickStr}?apikey=${APIkey}`;
  const response = await fetch(url);
  const data = await response.json();
  updateDB(data);
  updateMainTable(rows, data);
  updateMOEXprices(rows, tickList_rus);
  if (userLoggedIn()) fillTopInfo();
}

async function updateMOEXprices(rows, tickList_rus) {
  let data = [];
  for (let stock of tickList_rus) {
    const comp = await checkComp_RU(stock);
    data.push(comp);
  }
  updateMainTable(rows, data);
}

function updateMainTable(rows, data) {
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
        day.innerHTML = item.changesPercentage
          ? `${item.changesPercentage?.toFixed(2)} %`
          : "";
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
}

function updateDB(data) {
  for (let item of data) {
    fetch(`DB/update`, {
      method: "PUT",
      body: JSON.stringify({
        day: item.changesPercentage,
        price: item.price,
        ticker: item.symbol,
        market: item.exchange,
        eps: item.eps,
        pe: item.pe,
        priceAvg200: item.priceAvg200,
      }),
    });
  }
}

async function checkComp_US(ticker) {
  // free version allow only 250 API calls daily
  // russian stocks will be checked first to not spend this 250 calls
  const ruStock = await checkComp_RU(ticker);
  if (ruStock) return ruStock;
  // now we check for US stocks
  // const APIkey = await getKey();
  const APIkey = "aa0e59ae3e34a1ace7188048088c0dc3"; //test
  let url = `https://financialmodelingprep.com/api/v3/quote/${ticker}?apikey=${APIkey}`;
  const response = await fetch(url);
  let data = await response.json();
  if (data[0]) return data[0];
  else {
    const realTicker = await getTicker(ticker);
    if (realTicker) return await checkComp_US(realTicker);
    else return "no such company";
  }
}

async function checkComp_RU(ticker) {
  let url = `https://iss.moex.com/iss/engines/stock/markets/shares/securities/${ticker}.json`;
  const response = await fetch(url);
  let data = await response.json();
  if (data.marketdata.data.length == 0) {
    return false;
  }
  let prices, price;
  let i = 0;
  while (data.marketdata.data[i][1] !== "TQBR") {
    i++;
    prices = data.marketdata.data[i];
  }
  for (let [n, item] of prices.entries()) {
    if (typeof item === "number" && item !== 0) {
      price = prices[n];
      break;
    }
  }
  const desc = data.securities.data[0];
  const exchangeRate = await GiveExchangeFor("rub");
  const company = {
    symbol: prices[0],
    name: desc[20],
    price: price * exchangeRate,
    market: "MOEX",
  };
  return company;
}

async function getTicker(name) {
  const response = await fetch(`getTicker/${name}`);
  const data = await response.json();
  return data.ticker;
}

async function getKey() {
  let key = localStorage.getItem("APIkey");
  if (!key) {
    const response = await fetch("getKey");
    const data = await response.json();
    localStorage.setItem("APIkey", data.key);
    key = data.key;
  }
  return key;
}

async function GiveExchangeFor(currency) {
  // this API can do much more than this
  const url = `https://cdn.jsdelivr.net/gh/fawazahmed0/currency-api@1/latest/currencies/${currency}/usd.json`;
  const response = await fetch(url);
  const data = await response.json();
  return data.usd;
}
// -------------------------------------------------------------------------------------------------
