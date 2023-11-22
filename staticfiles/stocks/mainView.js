import { searchFormFunction } from "./search.js";
import { fillTopInfo } from "./topInfo.js";
import { checkComp_RU, MainTableData } from "./serverConnect.js";
import { userLoggedIn, updateBrowserHistory, RedGreenText } from "./helpers.js";

export function showingMain() {
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

function updateBtnFunction() {
  const updateBtn = document.querySelector(".prices-btn");
  // prettier-ignore
  updateBtn.addEventListener("mouseover", function () {this.textContent = "Update"});
  // prettier-ignore
  updateBtn.addEventListener("mouseout", function () {this.textContent = "Price, $"});
  updateBtn.addEventListener("mouseup", updateAllPrices);
}

async function updateAllPrices() {
  showBtnLoader(true);
  try {
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
    const data = await MainTableData(tickStr);
    await updateMainTable(rows, data);
    //! temporary cancel
    // await updateMOEXprices(rows, tickList_rus);
    userLoggedIn() && fillTopInfo();
  } catch (err) {
    console.error("Couldn't update main table", err.message);
  } finally {
    showBtnLoader(false);
  }
}

function showBtnLoader(bool) {
  const updateBtn = document.querySelector(".prices-btn");
  const threeDots = document.querySelector(".three-dots");
  updateBtn.style.display = bool ? "none" : "block";
  threeDots.style.display = bool ? "flex" : "none";
}

async function updateMOEXprices(rows, tickList_rus) {
  try {
    let data = [];
    for (let stock of tickList_rus) data.push(await checkComp_RU(stock));
    updateMainTable(rows, data);
  } catch (err) {
    throw err;
  }
}

async function updateMainTable(rows, data) {
  try {
    for (let [_, row] of rows.entries()) {
      const ticker = row.querySelector("#company-ticker").innerHTML;
      const day = row.querySelector("#day-one");
      const myPrice = +row.querySelector(".my-price-row").innerHTML;
      const quan = +row.querySelector(".quantity-row").innerHTML;
      const price = row.querySelector(".market-price");
      const sigma = row.querySelector(".sigma-row");
      const change = row.querySelector("#change-field");
      for (const item of data) {
        if (item.symbol !== ticker) continue;
        const priceToday = quan * item.price;
        const priceOrig = quan * myPrice;
        day.innerHTML = item.changesPercentage
          ? `${item.changesPercentage?.toFixed(2)} %`
          : "";
        price.innerHTML = item.price.toFixed(2);
        sigma.innerHTML = priceToday.toFixed(2);
        const chNum = ((priceToday / priceOrig - 1) * 100).toFixed(2);
        change.innerHTML = `${chNum} %`;
        // prettier-ignore
        [price, sigma, change, day].forEach((elem) => elem.classList.add("animate"));
        setTimeout(function () {
          price.className = "market-price";
          sigma.className = "sigma-row";
          change.className = RedGreenText(chNum);
          day.className = RedGreenText(item.changesPercentage);
        }, 1500);
        break;
      }
    }
  } catch (err) {
    console.error("Error during main table update", err.message);
  }
}
