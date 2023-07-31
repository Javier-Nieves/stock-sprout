"use strict";
document.addEventListener("DOMContentLoaded", loadingSequence);

async function loadingSequence() {
  checkMessages();
  loadCorrectView();
  capitalizeName();
  handleClicks();
  const loggedIn = await AuthCheck();
  localStorage.setItem("loggedIn", loggedIn);
  loggedIn && fillTopInfo();
  loggedIn && activateDivForm();
  // browser back button action
  window.addEventListener("popstate", loadCorrectView);
}

function handleClicks() {
  // showing views
  const randomCompBtns = document.querySelectorAll(".companies-btn");
  const compSearchBtn = document.querySelector(".comp-search-btn");
  const portBtn = document.querySelector(".portfolio-btn");
  const histBtn = document.querySelector(".history-btn");
  const nodes = ["#mainTable", "#HistTable", ".ticker-search-container"];
  portBtn.addEventListener("click", showingMain);
  histBtn.addEventListener("click", showingHistory);
  randomCompBtns.forEach((btn) => btn.addEventListener("click", showComp_link));
  compSearchBtn.addEventListener("click", showComp_CompSearch);
  for (const node of nodes)
    document.querySelector(node).addEventListener("click", (e) => {
      const compName = e.target.closest(".data-storage")?.dataset.ticker;
      compName && compName !== "DIV" && show_company(compName);
    });
  // sorting main table
  const sorters = document.querySelectorAll(".sorter");
  sorters.forEach((column) =>
    column.addEventListener("click", (e) => sortTable(e.target))
  );
}

function loadCorrectView() {
  Timer("check");
  let url = window.location.href;
  if (
    url.includes("action") ||
    url.includes("logout") ||
    url.includes("login")
  ) {
    updateBrowserHistory("/");
    localStorage.getItem("loggedIn") && showingMain();
  }
  if (url.includes("company"))
    show_company(url.slice(url.lastIndexOf("/") + 1));
  if (url.includes("history")) showingHistory();
  if (url.slice(-1) === "/") showingMain();
}

// -------------------------------------------------------------------------------------------------
function searchFormFunction() {
  const form = document.querySelector("#searchForm");
  const compName = form.querySelector("#searchForComp");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (compName.value === "") return;
    mutateForm(true);
    fillFormWithData(compName.value);
    showActionBtns();
    compName.value = "";
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
  const container = document.querySelector(".ticker-search-container");
  let data = await checkComp(compName);
  if (typeof data !== "string") {
    name.innerHTML = data.name;
    price.innerHTML = `$ ${data.price.toFixed(2)}`;
    PE.innerHTML = data.pe || "-";
    avPr200.innerHTML = ` $ ${data.priceAvg200?.toFixed(2) || "-"}`;
    container.dataset.ticker = data.symbol;
    mutateForm(false);
    sendStockToServer(data);
  } else {
    mutateForm(false);
    ShowMessage(data);
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

function sendStockToServer(data) {
  // console.log("sending to server ", data);
  fetch("/dataHandler", {
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

// -------------------------------------------------------------------------------------------------
function showingMain() {
  updateBrowserHistory("/");
  searchFormFunction();
  updateBtnFunction();
  updateAllPrices();
  document.querySelector("#company-view").style.display = "none";
  document.querySelector("#portfolio-view").style.display = "block";
  document.querySelector("#summary-row-top").style.display = "flex";
  userLoggedIn() &&
    (document.querySelector("#history-view").style.display = "none");
}

function showComp_link() {
  if (userLoggedIn()) {
    document.querySelector("#hidden-buy-form").style.display = "none";
    document.querySelector(".big-green-btn").style.display = "block";
  }
  show_company("random");
}

function showComp_CompSearch() {
  const compName = document.querySelector("#comp-search").value.toUpperCase();
  if (compName === "") return;
  document.querySelector("#comp-search").value = "";
  document.querySelector("#hidden-buy-form").style.display = "none";
  if (userLoggedIn())
    document.querySelector(".big-green-btn").style.display = "block";
  show_company(compName);
}

async function show_company(compName) {
  console.log("showing", compName);
  document.querySelector("#portfolio-view").style.display = "none";
  document.querySelector("#summary-row-top").style.display = "none";
  document.querySelector("#company-view").style.display = "block";
  if (userLoggedIn())
    document.querySelector("#history-view").style.display = "none";
  blurAllFields(true);
  compName === "random" && (compName = await getRandomTicker());
  let data = await checkComp(compName);
  // if no such company:
  if (typeof data === "string") {
    ShowMessage(data);
    blurAllFields(false);
    return;
  }
  comp_fillName(data);
  comp_fillPrice(data);
  comp_fillAvPr200(data);
  await comp_fillRest(data);
  blurAllFields(false);
  updateBrowserHistory(`/company/${compName}`);
}

async function getRandomTicker() {
  const response = await fetch("/DB/random");
  const data = await response.json();
  return data.randomTicker;
}

async function comp_fillRest(data) {
  data.exchange !== "MOEX" && (data.desc = await getDescription(data.symbol));
  fillFinParams(data);
  document.querySelector("#company-eps").innerHTML = data.eps || "-";
  comp_fillDesc(data.desc || "No description");
}

async function getDescription(ticker) {
  const response = await fetch(`/getDesc/${ticker}`);
  const data = await response.json();
  return data.desc;
}

async function fillFinParams(data) {
  const allFields = document.querySelectorAll(".finParam");
  allFields.forEach((field) => {
    field.innerHTML = "";
  });
  if (data.exchange === "MOEX") return;
  const pe = document.querySelector("#company-pe");
  const fpe = document.querySelector("#company-fpe");
  const pb = document.querySelector("#company-pb");
  const roe = document.querySelector("#company-roe");
  const debt = document.querySelector("#company-debt");
  const profitMargins = document.querySelector("#company-profitMargins");
  const dividends = document.querySelector("#company-dividends");
  const divPer = document.querySelector("#company-dividends-yield");
  const button = document.querySelector(".big-green-btn");

  const company = await finParamFromAPI(data.symbol);
  // todo - add checks
  const divYield = (company.dividends / data.price) * 100;
  pe.innerHTML = company.pe.toFixed(2) || "-";
  fpe.innerHTML = company.fpe.toFixed(2) || "-";
  pb.innerHTML = company.PB.toFixed(2) || "-";
  roe.innerHTML = `${(company.ROE * 100).toFixed(2)} %` || "-";
  debt.innerHTML = company.debt.toFixed(2) || "-";
  profitMargins.innerHTML =
    `${(company.profitMargins * 100).toFixed(2)} %` || "-";
  dividends.innerHTML = company.dividends.toFixed(1) || "-";
  divPer.innerHTML = `${divYield.toFixed(2)} %` || "-";
  if (userLoggedIn())
    button.addEventListener("click", () => activateBuyForm(data.symbol));
}

async function finParamFromAPI(ticker) {
  const APIkey = await getKey();
  let url_params = `https://financialmodelingprep.com/api/v3/ratios/${ticker}?apikey=${APIkey}`;
  const response_params = await fetch(url_params);
  const finData = await response_params.json();
  return {
    pe: +finData[0].priceEarningsRatio?.toFixed(2),
    fpe: +finData[0].priceEarningsToGrowthRatio?.toFixed(2),
    PB: +finData[0].priceToBookRatio?.toFixed(2),
    ROE: +finData[0].returnOnEquity?.toFixed(2),
    profitMargins: +finData[0].netProfitMargin?.toFixed(2),
    dividends: +finData[0].dividendPayoutRatio?.toFixed(2),
    debt: +finData[0].debtEquityRatio?.toFixed(2),
  };
}

function comp_fillDesc(fullText) {
  const desc = document.querySelector("#company-desc");
  desc.innerHTML = truncate(fullText, 600);
  let collapsed = true;
  desc.addEventListener("click", () => {
    desc.innerHTML = collapsed ? fullText : truncate(fullText, 600);
    collapsed = !collapsed;
  });
}

function comp_fillName(data) {
  document.querySelector("#company-title").innerHTML = `${MakeCapitalized(
    data.name
  )}`;
  document.querySelector("#comp-ticker").innerHTML = data.symbol;
  document.querySelector("#hidden-ticker-comp").value = data.symbol;
}
function comp_fillPrice(data) {
  document.querySelector("#res-comp-price").innerHTML = moneyFormat(
    data.price,
    2
  );
  const resComDay = document.querySelector("#res-comp-day");
  const valuePer = data.changesPercentage?.toFixed(1);
  resComDay.innerHTML = `${valuePer || "-"} % `;
  resComDay.className = `med-text ${RedGreenText(valuePer)}`;
}
function comp_fillAvPr200(data) {
  let potential = (data.priceAvg200 / data.price - 1) * 100 || 0;
  document.querySelector("#comp-target-dol").innerHTML = moneyFormat(
    data.priceAvg200,
    2
  );
  const targPer = document.querySelector("#comp-target-per");
  targPer.innerHTML = `${potential.toFixed(1)} %`;
  targPer.className = `med-text ${RedGreenText(potential)}`;
}

async function activateBuyForm(ticker) {
  let data = await checkComp(ticker);
  sendStockToServer(data);
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
  HistRows.forEach((Row) => changeHistRow(Row));
  // change div title when clicked:
  //? using event delegation
  document.querySelector("#HistTable").addEventListener("click", (e) => {
    if (e.target.classList.contains("div-title")) {
      console.log("calling");
      changeDivName(e.target.closest("tr"));
    }
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
    const titleCell = Row.querySelector("#change-title");
    const newTitle = titleCell.value;
    const ident = titleCell.dataset.histid;
    fetch(`/change/${ident}/${newTitle}`);
    // todo - check if fetch was successful
    NormTitle.style.display = "block";
    NormTitle.innerHTML = newTitle;
    ChangedTitle.style.display = "none";
    console.log("show");
    ShowMessage("Entry modified");
  });
}
const activateDivForm = () =>
  document.getElementById("Div-form").addEventListener("submit", getDividend); //event

async function getDividend(event) {
  event.preventDefault();
  const title = document.querySelector("#Div-title").value;
  const amount = document.querySelector("#Div-amount").value;
  console.log("geting new dids", title, amount);
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
  HistRow.classList.add("hist-row", "new-hist-row");
  HistRow.style.backgroundColor = "rgba(255, 205, 4, 0.165)";
  const cells = [];
  const content = ["DIV", `${title}`, "Div", "-", "-", "-", "-", `${amount}`];
  for (let [k, item] of content.entries()) {
    cells[k] = HistRow.insertCell(k);
    cells[k].innerHTML = item;
  }
  cells[7].classList.add("green-text");
  cells[0].classList.add("mobile-hide");
  cells[2].classList.add("mobile-hide");
  HistRow.style.animationPlayState = "running";
  return HistRow;
}

function updateProfits(amount) {
  const valuesToChange = document
    .querySelector("#profit-main")
    .querySelectorAll(".sum-value");
  valuesToChange.forEach((value) => {
    let profitValue = Number.parseInt(
      value.innerHTML.replace("$", "").replaceAll(" ", "")
    );
    let newValue = profitValue + Math.round(+amount);
    value.innerHTML = moneyFormat(newValue);
  });
}

function makeDivCellChangable(HistRow, newEntryId) {
  HistRow.cells[1].classList.add("div-title");
  const techCell = HistRow.insertCell(2);
  techCell.id = "change-title-cell";
  techCell.innerHTML = `
        <div class="flex-container">
            <input class='ticker-inp long' type="text" id="change-title" 
            value="${HistRow.cells[1].innerHTML}" data-histid=${newEntryId}>
            <input id="div-title-change-btn" class="div-btn" type="submit" value="Change">
        </div>
  `;
}

// -------------------------------------------------------------------------------------------------
function fillTopInfo() {
  let { sum1, sum2, dayCh } = calculateMainParameters();
  let [nowChange, perChange] = calculateSecParameters(sum1, sum2, dayCh);
  fillMainBlock(sum1);
  fillChangeBlock("#nowChange", sum2, nowChange);
  fillChangeBlock("#dayChange", dayCh, perChange);
  fillEarnProfit(sum1, sum2);
}

function calculateMainParameters() {
  const rows = document.querySelectorAll(".table-row");
  const parameters = Array.from(rows).reduce(
    (params, row) => {
      const myPr = +row.querySelector(".my-price-row").innerHTML;
      const Qu = +row.querySelector(".quantity-row").innerHTML;
      const Si = +row.querySelector(".sigma-row").innerHTML;
      const dayOne =
        Number.parseFloat(row.querySelector("#day-one").innerHTML) || 0;
      params.sum1 += Math.trunc(myPr * Qu); // money originally paid for all stocks
      params.sum2 += Math.trunc(Si); // actual money in stocks now
      params.dayCh += Math.trunc((Si * dayOne) / 100); // day change in dollars for every stock combined
      return params;
    },
    { sum1: 0, sum2: 0, dayCh: 0 }
  );
  return parameters;
}

function calculateSecParameters(sum1, sum2, dayCh) {
  let nowChange = +((sum2 / sum1 - 1) * 100).toFixed(2) || 0;
  let perChange = +((dayCh / sum2) * 100).toFixed(2) || 0;
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
  const profitBox = document.querySelector("#profit");
  let earnings = +earnElem.innerHTML.replaceAll(" ", "").replace("$", "");
  let prof = sum2 - sum1 + earnings;
  earnElem.innerHTML = moneyFormat(earnings);
  profitBox.innerHTML = moneyFormat(prof);
  profitBox.className = `sum-value ${RedGreenText(prof)}`;
}

const fillMainBlock = (sum1) =>
  (document
    .querySelector("#invested-main")
    .querySelector(".sum-value").innerHTML = moneyFormat(sum1));

// -------------------------------------------------------------------------------------------------
function sortTable(tar) {
  const whichSort = tar.classList;
  const table = document.getElementById("mainTable").querySelector("tbody");
  const rows = table.rows;
  const crit = determineSortParameter(whichSort);
  const rowMap = new Map();
  for (let [i, row] of Array.from(table.rows).entries()) {
    const param = +row
      .querySelector(crit)
      ?.innerHTML.replaceAll(" ", "")
      .replace("%", "");
    rowMap.set(param, row);
  }
  const sortedArray = [...rowMap];
  sortedArray.sort((a, b) =>
    whichSort.contains("Up") ? b[0] - a[0] : a[0] - b[0]
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
  whichSort.contains("Up")
    ? whichSort.replace("Up", "Down")
    : whichSort.replace("Down", "Up");
}

function determineSortParameter(whichSort) {
  let crit;
  if (whichSort.contains("sortSigma")) crit = ".sigma-row";
  else if (whichSort.contains("sortChange")) crit = "#change-field";
  else if (whichSort.contains("sortDay")) crit = "#day-one";
  return crit;
}

// -------------------------------------------------------------------------------------------------
function moneyFormat(number, digits = 0) {
  const options = {
    style: "currency",
    currency: "USD",
    CurrencyDisplay: "narrowSymbol",
    maximumFractionDigits: digits,
  };
  const formatted = new Intl.NumberFormat("en-US", options)
    .format(+number)
    .replace(",", " ");
  return isNaN(+number) ? "-" : formatted;
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
  let converted = low.at(0).toUpperCase() + low.slice(1);
  const separators = [" ", "&", "-"];
  let capitalized = "";
  let next;
  for (const char of converted) {
    capitalized += next ? char.toUpperCase() : char;
    next = false;
    if (separators.includes(char)) next = true;
  }
  return capitalized;
}

function truncate(string, length) {
  return string.length > length ? `${string.substr(0, length)}...` : string;
}

function checkMessages() {
  const message = document.querySelector("#message");
  if (message) ShowMessage(message.innerHTML);
}

function ShowMessage(text) {
  let url = window.location.href;
  if (url.includes("company") || url.includes("history")) {
    ShowMessageDialog(text);
  } else {
    ShowMessageSearchBox(text);
  }
}

function ShowMessageDialog(text) {
  const dialog = document.querySelector("#modal-messenger");
  dialog.showModal();
  const message = document.querySelector("#modal-message");
  message.innerHTML = text;
  setTimeout(() => {
    dialog.close();
  }, 2000);
}

function ShowMessageSearchBox(text) {
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
    document.querySelector(element).style.filter = bool
      ? "blur(5px)"
      : "blur(0)";
  }
  const sumRows = document.querySelectorAll(".summary-row");
  sumRows.forEach((item) => {
    item.style.filter = bool ? "blur(5px)" : "blur(0)";
  });
}

async function AuthCheck() {
  const resp = await fetch(`/authCheck`);
  const data = await resp.json();
  return data.LoggedIn;
}

const userLoggedIn = () => localStorage.getItem("loggedIn") === "true";

function Timer(action) {
  if (action == "stop") {
    localStorage.removeItem("countdown");
    return;
  }
  let countdown;
  // localStorage is set in index.html
  if (localStorage.getItem("countdown") !== null)
    countdown = localStorage.getItem("countdown");
  const timer = document.getElementById("time");
  if (timer !== null && localStorage.getItem("countdown") !== null) {
    const update = setInterval(function () {
      let minutes = String(Math.trunc(countdown / 60)).padStart(2, 0);
      let seconds = String(countdown % 60).padStart(2, 0);
      timer.innerHTML = `${minutes}:${seconds}`;
      localStorage.setItem("countdown", countdown);
      if (countdown === 0) {
        clearInterval(update);
        localStorage.removeItem("countdown");
        fetch("/logout");
        ShowMessage("Logged out");
        setTimeout(() => {
          location.reload();
        }, 1500);
      }
      countdown--;
    }, 1000);
  }
}

const updateBrowserHistory = (str) => window.history.pushState("_", "_", str);

const RedGreenText = (param) => (param < 0 ? "red-text" : "green-text");

// -------------------------------------------------------------------------------------------------
function updateBtnFunction() {
  const updateBtn = document.querySelector(".prices-btn");
  updateBtn.addEventListener("mouseover", function () {
    this.textContent = "Update";
  });
  updateBtn.addEventListener("mouseout", function () {
    this.textContent = "Price, $";
  });
  updateBtn.addEventListener("mouseup", async function () {
    showBtnLoader(true);
    await updateAllPrices();
    showBtnLoader(false);
  });
}

function showBtnLoader(bool) {
  const updateBtn = document.querySelector(".prices-btn");
  const threeDots = document.querySelector(".three-dots");
  updateBtn.style.display = bool ? "none" : "block";
  threeDots.style.display = bool ? "flex" : "none";
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
  const APIkey = await getKey();
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
  for (let stock of tickList_rus) data.push(await checkComp_RU(stock));
  updateMainTable(rows, data);
}

function updateMainTable(rows, data) {
  for (let [_, row] of rows.entries()) {
    const ticker = row.querySelector("#company-ticker").innerHTML;
    const day = row.querySelector("#day-one");
    const myPrice = +row.querySelector(".my-price-row").innerHTML;
    const quan = +row.querySelector(".quantity-row").innerHTML;
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
        animateList.forEach((elem) => elem.classList.add("animate"));
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
        ticker: item.symbol,
        day: item.changesPercentage,
        price: item.price,
      }),
    });
  }
}

async function checkComp(ticker) {
  // free version allow only 250 API calls daily
  // MOEX stocks will be checked first to not spend this 250 calls
  const ruStock = await checkComp_RU(ticker);
  // console.log("ruStock", ruStock);
  if (ruStock) return ruStock;
  // now we check for US stocks
  const APIkey = await getKey();
  let url = `https://financialmodelingprep.com/api/v3/quote/${ticker}?apikey=${APIkey}`;
  const response = await fetch(url);
  let data = await response.json();
  // console.log("US data", data);
  if (data[0]) return data[0];
  else {
    const realTicker = await getTicker(ticker);
    if (realTicker) return await checkComp(realTicker);
    else return "No such company";
  }
}

async function checkComp_RU(ticker) {
  if (ticker === "") return;
  let url = `https://iss.moex.com/iss/engines/stock/markets/shares/securities/${ticker}.json`;
  const response = await fetch(url);
  let data = await response.json();
  // console.log("checkComp data:", data);
  if (data.marketdata.data.length == 0) return false;
  const prices = data.marketdata.data.find((elem) => elem.includes("TQBR"));
  const price = prices.find((item) => typeof item === "number" && item !== 0);
  const exchangeRate = await GiveExchangeFor("rub");
  const company = {
    symbol: prices[0],
    changesPercentage: null,
    name: data.securities.data[0][20],
    price: price * exchangeRate,
    exchange: "MOEX",
  };
  return company;
}

async function getTicker(name) {
  const response = await fetch(`/getTicker/${name}`);
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
