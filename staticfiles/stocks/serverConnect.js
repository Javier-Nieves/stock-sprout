import { ShowMessage } from "./helpers.js";

export async function AuthCheck() {
  try {
    const resp = await fetch(`/authCheck`);
    const data = await resp.json();
    return data.LoggedIn;
  } catch (err) {
    console.error("Authentication error!", err.message);
  }
}

export function sendStockToServer(data) {
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

export async function getRandomTicker() {
  try {
    const response = await fetch("/DB/random");
    const data = await response.json();
    return data.randomTicker;
  } catch (err) {
    console.error("Can't receive random ticker from DB", err.message);
  }
}

export async function getDescription(ticker) {
  const response = await fetch(`/getDesc/${ticker}`);
  const data = await response.json();
  return data.desc;
}

export async function finParamFromAPI(ticker) {
  try {
    const APIkey = await getKey();
    let url_params = `https://financialmodelingprep.com/api/v3/ratios/${ticker}?apikey=${APIkey}`;
    const response_params = await fetch(url_params);
    const [finData] = await response_params.json();
    return {
      pe: +finData.priceEarningsRatio?.toFixed(2),
      fpe: +finData.priceEarningsToGrowthRatio?.toFixed(2),
      PB: +finData.priceToBookRatio?.toFixed(2),
      ROE: +finData.returnOnEquity?.toFixed(2),
      profitMargins: +finData.netProfitMargin?.toFixed(2),
      dividends: +finData.dividendPayoutRatio?.toFixed(2),
      debt: +finData.debtEquityRatio?.toFixed(2),
    };
  } catch (err) {
    console.error("Can't receive financial data for", compName, err.message);
  }
}

export function changeDivName(Row) {
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
    ShowMessage("Entry modified");
  });
}

export async function SendDivToDB(title, amount) {
  const response = await fetch(`/history/dividend`, {
    method: "PUT",
    body: JSON.stringify({
      title: title,
      amount: amount,
    }),
  });
  return await response.json();
}

export async function checkComp(ticker) {
  try {
    // free version allow only 250 API calls daily
    // MOEX stocks will be checked first to not spend this 250 calls
    const ruStock = await checkComp_RU(ticker);
    if (ruStock) return ruStock;
    // now we check for US stocks
    const APIkey = await getKey();
    //todo - add guard clause for non-us companies
    let url = `https://financialmodelingprep.com/api/v3/quote/${ticker}?apikey=${APIkey}`;
    const response = await fetch(url);
    let [data] = await response.json();
    if (data) return data;
    else {
      const realTicker = await getTicker(ticker);
      if (realTicker) return await checkComp(realTicker);
      else return "No such company";
    }
  } catch (err) {
    // prettier-ignore
    console.error("Company data couldn't not be received for", ticker, err.message);
  }
}

export async function checkComp_RU(ticker) {
  try {
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
  } catch (err) {
    console.error("MOEX company check failed for", ticker, err.message);
  }
}

export async function MainTableData(tickStr) {
  const APIkey = await getKey();
  let url = `https://financialmodelingprep.com/api/v3/quote/${tickStr}?apikey=${APIkey}`;
  const response = await fetch(url);
  const data = await response.json();
  updateDB(data);
  return data;
}

async function getKey() {
  try {
    let key = localStorage.getItem("APIkey");
    if (key) return key;
    const response = await fetch("getKey");
    const data = await response.json();
    localStorage.setItem("APIkey", data.key);
    key = data.key;
    return key;
  } catch (err) {
    console.error("Can't receive API key", err.message);
  }
}

async function GiveExchangeFor(currency) {
  try {
    // this API can do much more than this
    const url = `https://cdn.jsdelivr.net/gh/fawazahmed0/currency-api@1/latest/currencies/${currency}/usd.json`;
    const response = await fetch(url);
    const data = await response.json();
    return data.usd;
  } catch (err) {
    console.error("Currency exchange failed", err.message);
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

async function getTicker(name) {
  try {
    const response = await fetch(`/getTicker/${name}`);
    const data = await response.json();
    return data.ticker;
  } catch (err) {
    console.error("Can't receive ticker for", name, err.message);
  }
}
