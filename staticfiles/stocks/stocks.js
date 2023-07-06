"use strict";
let loggedIn;
document.addEventListener("DOMContentLoaded", () => {
  // is there a message from backend?
  const message = document.querySelector("#message");
  if (message !== null) {
    ShowMessage(message.innerHTML);
  }

  AuthCheck()
    .then((answer) => {
      loggedIn = answer;
    })
    .then(() => {
      if (loggedIn) {
        // ? Top 4 columns information
        fillTopInfo();
        // ? Dividend form handling
        const form = document.getElementById("Div-form");
        form.addEventListener("submit", getDividend);
      }

      loadCorrectView();

      // back button action
      window.addEventListener("popstate", loadCorrectView);

      document.addEventListener("click", (event) => {
        const tar = event.target;
        //? show a view
        showingCompany(tar);
        if (tar.className.includes("portfolio-btn")) showingMain();
        if (tar.className.includes("history-btn")) showingHistory();
        //? or sort main table
        if (tar.className.includes("Up") || tar.className.includes("Down"))
          sortTable(tar);
      });

      searchFormFunction();
      updateBtnFunction();
      capitalizeName();
    });
});

// ! ------- functions --------
function showActionBtns() {
  document.querySelector(".ticker-search-container").className = "ticker-link";
  if (loggedIn)
    document.getElementById("action-buttons").style.animationPlayState =
      "running";
}

function searchFormFunction() {
  // * if company is searched - make Search field clickable and Buy button appear
  const filledSearchForm = document.querySelector("#check-filled");
  if (filledSearchForm !== null) {
    if (filledSearchForm.innerHTML !== "") showActionBtns();
    document
      .querySelector("#main-view-search")
      .addEventListener("click", beginSearch);
  }
}

function beginSearch() {
  if (document.querySelector(".ticker-inp").value != "") {
    document.querySelector("#main-view-search").value = "Loading..";
    document.querySelector(".loader").classList.remove("hidden");
    const innerBoxes = document.querySelectorAll(".ticker-search-box");
    innerBoxes.forEach((item) => {
      item.style.filter = "blur(3px)";
    });
  }
}

function showingMain() {
  window.history.pushState("unused", "unused", `/`);
  document.querySelector("#company-view").style.display = "none";
  document.querySelector("#portfolio-view").style.display = "block";
  if (loggedIn) {
    document.querySelector("#summary-row-top").style.display = "flex";
    document.querySelector("#history-view").style.display = "none";
  }
}

function showingCompany(tar) {
  const clName = tar.parentElement.className;
  let compName;
  // * from History
  if (clName.includes("hist-row")) {
    if (tar.parentElement.querySelector(".hist-action").innerHTML != "Div") {
      compName =
        tar.parentElement.querySelector("#hist-company-name").innerHTML;
    }
  }
  // * from Main Table Index
  if (clName.includes("table-row")) {
    compName = tar.parentElement.querySelector("#company-ticker").innerHTML;
  }
  // * by link on top
  if (tar.className.includes("companies-btn")) {
    compName = "random";
    if (loggedIn) {
      document.querySelector("#hidden-buy-form").style.display = "none";
      document.querySelector(".big-green-btn").style.display = "block";
    }
  }
  // * from search button in Index
  if (tar.parentElement.parentElement.className.includes("ticker-link")) {
    compName = document.querySelector("#hidden-ticker").value;
  }
  // * company search button in Company View
  if (tar.className.includes("comp-search-btn")) {
    compName = document.querySelector("#comp-search").value.toUpperCase();
    document.querySelector("#comp-search").value = "";
    document.querySelector("#hidden-buy-form").style.display = "none";
    if (loggedIn)
      document.querySelector(".big-green-btn").style.display = "block";
  }
  if (compName) show_company(compName);
}

function showingHistory() {
  document.querySelector("#portfolio-view").style.display = "none";
  document.querySelector("#summary-row-top").style.display = "flex";
  document.querySelector("#history-view").style.display = "block";
  document.querySelector("#company-view").style.display = "none";

  let HistRows = document.querySelectorAll(".hist-row");
  HistRows.forEach((Item) => {
    let action = Item.querySelector(".hist-action").innerHTML;
    // switch statement is an if-else alternative
    switch (action) {
      case "Buy":
        Item.querySelector(".hist-sell").innerHTML = "-";
        break;
      case "Sell":
        Item.querySelector(".hist-buy").innerHTML = "-";
        Item.style.backgroundColor = "rgba(126, 21, 218, 0.08)";
        break;
      case "Div":
        Item.querySelector(".hist-buy").innerHTML = "-";
        Item.querySelector(".hist-amount").innerHTML = "-";
        Item.querySelector(".hist-price").innerHTML = "-";
        Item.querySelector("#hist-profit").innerHTML =
          Item.querySelector(".hist-sell").innerHTML;
        Item.querySelector("#hist-profit").style.color =
          "rgba(78, 235, 0, 0.908)";
        Item.querySelector(".hist-sell").innerHTML = "-";
        Item.style.backgroundColor = "rgba(255, 205, 4, 0.165)";
        break;
      default:
        console.log("Incorrect action!");
    }
    // if dividend title is clicked - change div title
    Item.addEventListener("click", (event) => {
      const tar2 = event.target;
      if (tar2.className.includes("div-title")) changeDivName(Item);
    });
  });
  window.history.pushState("unused", "unused", `/history`);
}

function changeDivName(Item) {
  const NormTitle = Item.querySelector(".div-title");
  const ChangedTitle = Item.querySelector("#change-title-cell");
  const changeBtn = Item.querySelector("#div-title-change-btn");
  NormTitle.style.display = "none";
  ChangedTitle.style.display = "block";
  changeBtn.addEventListener("click", () => {
    const newTitle = Item.querySelector("#change-title").value;
    const ident = Item.querySelector("#hidden-hist-id").value;
    fetch(`/change/${ident}/${newTitle}`);
    NormTitle.style.display = "block";
    NormTitle.innerHTML = newTitle;
    ChangedTitle.style.display = "none";
    ShowMessage("Entry modified");
  });
}

function fillTopInfo() {
  const rows = document.querySelectorAll(".table-row");
  let sum1 = 0;
  let sum2 = 0;
  let dayCh = 0;

  rows.forEach((row) => {
    let dayOne;
    let myPr = parseFloat(row.querySelector(".my-price-row").innerHTML);
    let Qu = parseFloat(row.querySelector(".quantity-row").innerHTML);
    let Si = parseFloat(row.querySelector(".sigma-row").innerHTML);
    sum1 += myPr * Qu;
    sum2 += Si;
    dayOne = parseFloat(row.querySelector("#day-one").innerHTML) || 1;
    dayCh += (Si / (100 + dayOne)) * 100;
  });

  let dayChMoney = parseFloat(sum2 - dayCh).toFixed();
  dayCh = parseFloat((sum2 / dayCh - 1) * 100).toFixed(2);
  // todo - try ||=
  dayCh = +dayCh || 0;

  sum1 = Number(parseFloat(sum1).toFixed());
  sum2 = Number(parseFloat(sum2).toFixed());
  let perChange = parseFloat((sum2 / sum1 - 1) * 100).toFixed(1);
  perChange = +perChange || 0;
  const earnElem = document.querySelector("#earnings");
  let earnings = Number(
    earnElem.innerHTML.replaceAll(" ", "").replace("$", "")
  );
  let prof = parseFloat(sum2 - sum1 + earnings).toFixed();
  earnElem.innerHTML = moneyFormat(
    earnElem.innerHTML.replaceAll(" ", "").replace("$", "")
  );
  document
    .querySelector("#invested-main")
    .querySelector(".sum-value").innerHTML = moneyFormat(sum1);

  const nowChangeDol = document.querySelector("#nowChangeDol");
  const nowChangePer = document.querySelector("#nowChangePer");
  const dayColor = perChange >= 0 ? "green-text" : "red-text";
  nowChangeDol.classList.add(dayColor);
  nowChangePer.classList.add(dayColor);
  nowChangeDol.innerHTML = moneyFormat(sum2);
  nowChangePer.innerHTML = `${perChange} %`;

  const profitBox = document.querySelector("#profit");
  profitBox.className = `sum-value ${prof >= 0 ? "green" : "red"}-text`;
  profitBox.innerHTML = moneyFormat(prof);

  const dayChangeDol = document.querySelector("#dayChangeDol");
  const dayChangePer = document.querySelector("#dayChangePer");
  const dayClass = dayChMoney >= 0 ? "green-text" : "red-text";
  dayChangeDol.classList.add(dayClass);
  dayChangePer.classList.add(`${dayChMoney >= 0 ? "green" : "red"}-text`);
  dayChangeDol.innerHTML = moneyFormat(dayChMoney);
  dayChangePer.innerHTML = `${dayCh} %`;
}

function sortTable(tar) {
  let table, rows, switching, i, x, y, shouldSwitch;
  const whichSort = tar.className;
  table = document.getElementById("mainTable");
  switching = true;
  while (switching) {
    switching = false;
    rows = table.rows;
    let rowLen = rows.length;
    for (i = 1; i < rowLen - 1; i++) {
      shouldSwitch = false;
      // * parameter determination
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

      // * direction determination
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
        value.innerHTML = `&nbsp ${moneyFormat(newValue)} &nbsp`;
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

function show_company(compName) {
  window.history.pushState("unused", "unused", `/company/${compName}`);

  document.querySelector("#portfolio-view").style.display = "none";
  document.querySelector("#summary-row-top").style.display = "none";
  document.querySelector("#company-view").style.display = "block";
  if (loggedIn) document.querySelector("#history-view").style.display = "none";

  blurAllFields(true);

  fetch(`/companies/${compName}`)
    .then((response) => response.json())
    .then((result) => {
      if (result.message) {
        ShowMessage(result.message);
        blurAllFields(false);
      }
      // todo - when result.comp.targetPrice is null
      let potential =
        (result.comp?.targetPrice / result.comp?.price - 1) * 100 ?? 0;

      document.querySelector("#res-comp-price").innerHTML = `$ ${
        result.comp?.price?.toFixed(2) || "???"
      }`;
      const resComDay = document.querySelector("#res-comp-day");
      resComDay.innerHTML = `${result.comp?.day?.toFixed(1) || "???"} % `;
      resComDay.className = `med-text ${
        result.comp?.day < 0 ? "red-text" : "green-text"
      }`;

      // todo - html!
      document.querySelector(
        "#company-targetPrice"
      ).innerHTML = `<div class="comp-param-text"> Target price: </div> <div class="comp-param-value-big">$ ${
        result.comp?.targetPrice?.toFixed(2) || "???"
      } <div class='${
        potential > 0 ? "green" : "red"
      }-text med-text'>${potential.toFixed(1)} % </div></div>`;

      // populate forms with company's data
      document.querySelector("#hidden-ticker-comp").value = result.comp?.ticker;
      document.querySelector(
        "#company-recom"
      ).innerHTML = `<div class="comp-param-text"> Recommendation: </div> <div class="comp-param-value-big">${
        result.comp?.recom || "???"
      } </div>`;
      document.querySelector("#company-title").innerHTML = `${MakeCapitalized(
        result.comp?.company
      )} <div class='comp-param-text' style='text-align:center;'>${
        result.comp?.ticker
      }</div>`;
      const fullText = result.comp?.desc || "no description";
      let collapsed = true;
      document.querySelector("#company-desc").innerHTML = truncate(
        fullText,
        600
      );
      document.querySelector("#company-desc").addEventListener("click", () => {
        if (collapsed) {
          document.querySelector("#company-desc").innerHTML = fullText;
          collapsed = false;
        } else {
          document.querySelector("#company-desc").innerHTML = truncate(
            fullText,
            600
          );
          collapsed = true;
        }
      });
      fillCompData(result);
      blurAllFields(false);
    });
}

function fillCompData(result) {
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
    if (loggedIn) {
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

//!  Updating the prices

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
            if (loggedIn) fillTopInfo();
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
    change.className = `${chNum > 0 ? "green" : "red"}-text`;
    day.className = `${data.comp.day > 0 ? "green" : "red"}-text`;
    sigma.className = "sigma-row";
  }, 1500);
  return true;
}

function removeThreeDots() {
  const updateBtn = document.querySelector(".prices-btn");
  updateBtn.style.display = "block";
  document.querySelector(".three-dots").style.display = "none";
}

// ! other helper functions
function moneyFormat(string) {
  const changed = string + "";
  let txt;
  if (3 < changed.length < 7)
    txt = changed.slice(0, -3) + " " + changed.slice(-3);
  return ("$ " + txt).padEnd(9);
}

function capitalizeName() {
  if (loggedIn) {
    const name = document.querySelector(".username");
    let myName = name.innerHTML;
    name.innerHTML = MakeCapitalized(myName);
  }
}

function MakeCapitalized(string) {
  const low = string.toLowerCase();
  let converted = low.charAt(0).toUpperCase() + low.slice(1);
  let strLen = string.length;
  for (let i = 0; i < strLen; i++) {
    if (
      converted.charAt(i) === " " ||
      converted.charAt(i) === "&" ||
      converted.charAt(i) === "-"
    ) {
      converted =
        converted.slice(0, i + 1) +
        converted.charAt(i + 1).toUpperCase() +
        converted.slice(i + 2);
    }
  }
  return converted;
}

function truncate(string, length) {
  return string.length > length ? `${string.substr(0, length)}...` : string;
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
    window.history.pushState("unused", "unused", `/`);
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
