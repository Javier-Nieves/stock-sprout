"use strict";
let loggedIn = true;
document.addEventListener("DOMContentLoaded", () => {
  // AuthCheck()
  //   .then((answer) => {
  //     loggedIn = answer;
  //   })
  // .then(() => {
  if (loggedIn) {
    // ? Top 4 columns information
    fillTopInfo();
    // ? Dividend form handling
    const form = document.getElementById("Div-form");
    form.addEventListener("submit", getDividend);
  }

  loadCorrectView();

  // ! back button action
  window.addEventListener("popstate", function () {
    loadCorrectView();
  });

  document.addEventListener("click", (event) => {
    const tar = event.target;
    // ? show some view
    showingCompany(tar);
    if (tar.className.includes("portfolio-btn")) {
      showingMain();
    }
    if (tar.className.includes("history-btn")) {
      showingHistory();
    }
    // ? or sort main table
    if (tar.className.includes("Up") || tar.className.includes("Down")) {
      sortTable(tar);
    }
  });

  // ? search form mutations
  // * if company is searched - make Search field clickable and Buy button appear
  const filledSearchForm = document.querySelector("#check-filled");
  if (filledSearchForm.innerHTML !== "") {
    showActionBtns();
  }
  document.querySelector("#main-view-search").addEventListener("click", () => {
    beginSearch();
  });

  capitalizeName();

  updateBtnFunction();
  // });
});

// ! ------- functions --------
function showActionBtns() {
  document.querySelector(".ticker-search-container").className = "ticker-link";
  document.getElementById("action-buttons").style.animationPlayState =
    "running";
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
    try {
      document.querySelector("#hidden-buy-form").style.display = "none";
      document.querySelector(".big-green-btn").style.display = "block";
    } catch (error) {
      // console.error("An Error occurred:", error.message);
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
      if (tar2.className.includes("div-title")) {
        transformTitle(Item);
      }
    });
  });
  window.history.pushState("unused", "unused", `/history`);
}

function transformTitle(Item) {
  const NormTitle = Item.querySelector(".div-title");
  const ChangedTitle = Item.querySelector("#change-title-cell");
  NormTitle.style.display = "none";
  ChangedTitle.style.display = "block";
  Item.querySelector("#div-title-change-btn").addEventListener("click", () => {
    const newTitle = Item.querySelector("#change-title").value;
    const ident = Item.querySelector("#hidden-hist-id").value;
    fetch(`/change/${ident}/${newTitle}`);
    NormTitle.style.display = "block";
    NormTitle.innerHTML = newTitle;
    ChangedTitle.style.display = "none";
    ShowMessage("good", "Entry modified");
  });
}

function fillTopInfo() {
  const rows = document.querySelectorAll(".table-row");
  let sum1 = 0;
  let sum2 = 0;
  let dayCh = 0;

  rows.forEach((row) => {
    let myPr = parseFloat(row.querySelector(".my-price-row").innerHTML);
    let Qu = parseFloat(row.querySelector(".quantity-row").innerHTML);
    let Si = parseFloat(row.querySelector(".sigma-row").innerHTML);
    let dayOne = parseFloat(row.querySelector("#day-one").innerHTML);
    sum1 += myPr * Qu;
    sum2 += Si;
    dayCh += (Si / (100 + dayOne)) * 100;
  });

  let dayChMoney = parseFloat(sum2 - dayCh).toFixed(1);
  dayCh = parseFloat((sum2 / dayCh - 1) * 100).toFixed(2);
  // ? next line will do a toNumber conversion and provide a default value if dayCh = NaN
  dayCh = +dayCh || 0;

  sum1 = parseFloat(sum1).toFixed();
  sum2 = parseFloat(sum2).toFixed();
  let perChange = parseFloat((sum2 / sum1 - 1) * 100).toFixed(1);
  perChange = +perChange || 0;
  let earnings = Number(
    document.querySelector("#earnings").innerHTML.match(/\d+/)[0]
  );
  let prof = parseFloat(sum2 - sum1 + earnings).toFixed();

  document
    .querySelector("#invested-main")
    .querySelector(".sum-value").innerHTML = `$ ${moneyFormat(sum1)}`;

  const nowChange = document.querySelector("#nowChange");
  nowChange.classList.add(`${perChange >= 0 ? "green" : "red"}-text`);
  nowChange.innerHTML = `$ ${moneyFormat(sum2)} &nbsp ${perChange} % </div>`;

  const profitBox = document.querySelector("#profit");
  profitBox.className = `sum-value ${prof >= 0 ? "green" : "red"}-text`;
  profitBox.innerHTML = `&nbsp $ ${prof}`;

  const dayChange = document.querySelector("#dayChange");
  dayChange.classList.add(`${dayChMoney >= 0 ? "green" : "red"}-text`);
  dayChange.innerHTML = `$ ${dayChMoney} &nbsp ${dayCh} % </div>`;
}

function sortTable(tar) {
  let table, rows, switching, i, x, y, shouldSwitch;
  const whichSort = tar.className;
  table = document.getElementById("mainTable");
  switching = true;
  while (switching) {
    switching = false;
    rows = table.rows;
    for (i = 1; i < rows.length - 1; i++) {
      shouldSwitch = false;
      // * parameter determination
      if (whichSort.includes("sortSigma")) {
        x = rows[i].querySelector(".sigma-row").innerHTML;
        y = rows[i + 1].querySelector(".sigma-row").innerHTML;
      } else if (whichSort.includes("sortChange")) {
        x = rows[i].querySelector("#change-field").innerHTML;
        y = rows[i + 1].querySelector("#change-field").innerHTML;
      } else if (whichSort.includes("sortDay")) {
        x = rows[i].querySelector("#day-one").innerHTML;
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
  // * switch classes after sorting in main table
  if (whichSort.includes("Up")) tar.classList.replace("Up", "Down");
  else tar.classList.replace("Down", "Up");
}

function getDividend(event) {
  event.preventDefault();
  const form = document.getElementById("Div-form");
  const title = document.querySelector("#Div-title").value;
  const amount = document.querySelector("#Div-amount").value.toString();
  // make a call to backend to add this dividend to the DB
  fetch(`/history/dividend`, {
    method: "PUT",
    body: JSON.stringify({
      title: title,
      amount: amount,
    }),
  });

  // creatig new row for new dividend entry on the 1st position of the table
  const HistRow = document.querySelector("#HistTable").insertRow(0);
  HistRow.className = "new-hist-row";
  HistRow.style.backgroundColor = "rgba(255, 205, 4, 0.165)";

  const cells = [];
  const content = ["DIV", `${title}`, "Div", "-", "-", "-", "-", `${amount}`];
  for (let k = 0; k < 8; k++) {
    cells[k] = HistRow.insertCell(k);
    cells[k].innerHTML = content[k];
  }
  cells[7].className = "green-text";
  HistRow.style.animationPlayState = "running";

  // update profit value
  const valuesToChange = document
    .querySelector("#profit-main")
    .querySelectorAll(".sum-value");
  // get rid of space and $ sign
  valuesToChange.forEach((value) => {
    let profitValue = value.innerHTML.replace(/\s/g, "").match(/\d+/g);
    let newValue = parseInt(profitValue) + Math.round(Number(amount));
    value.innerHTML = `&nbsp $ ${moneyFormat(newValue)} &nbsp`;
  });

  form.reset();
  ShowMessage("good", "Dividends received");
}

// * for backend alerts to disappear
setTimeout(function () {
  try {
    const mes = document.getElementById("message");
    mes.style.animationPlayState = "running";
    setTimeout(function () {
      mes.remove();
    }, 2000);
  } catch {}
}, 3000); // in 3 sec

function show_company(compName) {
  window.history.pushState("unused", "unused", `/company/${compName}`);
  document.querySelector("#portfolio-view").style.display = "none";
  try {
    document.querySelector("#summary-row-top").style.display = "none";
    document.querySelector("#history-view").style.display = "none";
  } catch {}
  document.querySelector("#company-view").style.display = "block";

  blurAllFields(true);

  fetch(`/companies/${compName}`)
    .then((response) => response.json())
    .then((result) => {
      if (result.message) {
        ShowMessage("bad", `${result.message}`);
        blurAllFields(false);
      }
      const potential = (result.comp.targetPrice / result.comp.price - 1) * 100;

      document.querySelector("#res-comp-price").innerHTML = `$ ${
        result.comp.price?.toFixed(2) || "???"
      }`;
      document.querySelector("#res-comp-day").innerHTML = `${
        result.comp.day?.toFixed(1) || "???"
      } % `;

      if (result.comp.day < 0)
        document
          .querySelector("#res-comp-day")
          .classList.replace("green-text", "red-text");
      else
        document
          .querySelector("#res-comp-day")
          .classList.replace("red-text", "green-text");

      // todo - html!
      document.querySelector(
        "#company-targetPrice"
      ).innerHTML = `<div class="comp-param-text"> Target price: </div> <div class="comp-param-value-big">$ ${
        result.comp.targetPrice?.toFixed(2) || "???"
      } <div class='${
        potential > 0 ? "green" : "red"
      }-text med-text'>${potential.toFixed(1)} % </div></div>`;

      // populate forms with company's data
      document.querySelector("#hidden-ticker-comp").value = result.comp.ticker;
      document.querySelector(
        "#company-recom"
      ).innerHTML = `<div class="comp-param-text"> Recommendation: </div> <div class="comp-param-value-big">${
        result.comp.recom || "???"
      } </div>`;
      document.querySelector("#company-title").innerHTML = `${MakeCapitalized(
        result.comp.company
      )} <div class='comp-param-text' style='text-align:center;'>${
        result.comp.ticker
      }</div>`;
      const fullText = result.comp.desc ? result.comp.desc : "no description";
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
  const roe = result.comp.roe * 100;
  const divYield = (result.comp.dividends / result.comp.price) * 100;
  const marg = result.comp.profitMargins * 100;
  try {
    const part1 = '<div class="comp-param-text">';
    const part2 = '</div> <div class="comp-param-value">';
    document.querySelector("#company-pe").innerHTML = `${part1} PE: ${part2} ${
      result.comp.pe?.toFixed(1) || "???"
    } </div>`;
    document.querySelector(
      "#company-fpe"
    ).innerHTML = `${part1} Forward PE: ${part2} ${
      result.comp.fpe?.toFixed(1) || "???"
    }</div>`;
    document.querySelector("#company-pb").innerHTML = `${part1} PB: ${part2} ${
      result.comp.pb?.toFixed(1) || "???"
    }</div>`;
    document.querySelector(
      "#company-roe"
    ).innerHTML = `${part1} ROE: ${part2} ${roe?.toFixed(1) || "???"} %</div>`;
    document.querySelector(
      "#company-debt"
    ).innerHTML = `${part1} Debt to Equity: ${part2} ${
      result.comp.debt?.toFixed(2) || "???"
    }</div>`;
    document.querySelector(
      "#company-profitMargins"
    ).innerHTML = `${part1} Profit Margins: ${part2} ${
      marg?.toFixed(1) || "???"
    } %</div>`;
    document.querySelector(
      "#company-dividends"
    ).innerHTML = `${part1} Dividends: ${part2} $ ${
      result.comp.dividends?.toFixed(2) || "???"
    }</div>`;
    document.querySelector(
      "#company-dividends-yield"
    ).innerHTML = `${part1} Dividends yield: ${part2}  ${
      divYield?.toFixed(1) || "???"
    } %</div>`;

    document.querySelector(".big-green-btn").addEventListener("click", () => {
      document.querySelector("#hidden-buy-form").style.display = "block";
      document.querySelector(".big-green-btn").style.display = "none";
      document.querySelector("#hidden-buy-form").style.animationPlayState =
        "running";
    });
  } catch {}
}

// ! other helper functions
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
  updateBtn.onclick = () => {
    updatePrices();
  };
}

function moneyFormat(string) {
  const changed = string.toString();
  let txt;
  if (3 < changed.length < 7)
    txt = changed.slice(0, -3) + " " + changed.slice(-3);
  return txt;
}

function capitalizeName() {
  try {
    const name = document.querySelector(".username");
    let myName = name.innerHTML;
    name.innerHTML = MakeCapitalized(myName);
  } catch {}
}

function MakeCapitalized(string) {
  const low = string.toLowerCase();
  let converted = low.charAt(0).toUpperCase() + low.slice(1);
  for (let i = 0; i < string.length; i++) {
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

function updatePrices() {
  const rows = document.querySelectorAll(".table-row");
  let rowCount = 0;
  rows.forEach((row) => {
    const day = row.querySelector("#day-one");
    const price = row.querySelector(".market-price");
    const sigma = row.querySelector(".sigma-row");
    const change = row.querySelector("#change-field");
    const myPrice = Number(row.querySelector(".my-price-row").innerHTML);
    const quant = Number(row.querySelector(".quantity-row").innerHTML);
    let ticker = row.querySelector("#company-ticker").innerHTML;

    getData(ticker)
      .then((data) => {
        day.innerHTML = `${data.comp.day.toFixed(2)} %`;
        price.innerHTML = `${data.comp.price.toFixed(2)}`;
        let sigNum = quant * data.comp.price;
        sigma.innerHTML = sigNum.toFixed(2);
        let chNum = (data.comp.price / myPrice - 1) * 100;
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
      })
      .then(() => {
        rowCount++;
        if (rowCount === rows.length) {
          setTimeout(function () {
            if (loggedIn) {
              fillTopInfo();
            }
            const updateBtn = document.querySelector(".prices-btn");
            updateBtn.style.display = "block";
            document.querySelector(".three-dots").style.display = "none";
          }, 400);
        }
      })
      .catch((error) => {
        console.error(error);
      });
  });
}

async function getData(ticker) {
  const dbData = await fetch(`companies/${ticker}`);
  const compData = await dbData.json();
  return compData;
}

function truncate(string, length) {
  // conditional (ternary) operator is like If-Else statement. [condition ? (ifTrue); : (else);]
  return string.length > length ? `${string.substr(0, length)}...` : string;
}

function ShowMessage(color, text) {
  const success_msg = document.createElement("a");
  success_msg.className = `${
    color === "good" ? "message-buy" : "message-sell"
  }`;
  success_msg.id = "message";
  success_msg.innerHTML = `-= ${text} =-`;
  document.querySelector(".left-group").append(success_msg);
  setTimeout(function () {
    success_msg.style.animationPlayState = "running";
  }, 3000);
  setTimeout(function () {
    success_msg.remove();
  }, 4800);
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
  for (let b = 0; b < blurList.length; b++) {
    document.querySelector(`${blurList[b]}`).style.filter = `${
      bool ? "blur(4px)" : "blur(0)"
    }`;
  }
  const sumRows = document.querySelectorAll(".summary-row");
  sumRows.forEach((item) => {
    item.style.filter = `${bool ? "blur(4px)" : "blur(0)"}`;
  });
}

function loadCorrectView() {
  // The popstate event is fired each time when the current history entry changes.
  if (window.location.href.slice(-7) === "history") {
    showingHistory();
  }
  if (window.location.href.slice(-1) === "/") {
    showingMain();
  }
  if (window.location.href.slice(-6) === "action") {
    window.history.pushState("unused", "unused", `/`);
  }
  if (window.location.href.includes("company")) {
    const location = window.location.href.indexOf("company");
    const company = window.location.href.slice(location + 8);
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
