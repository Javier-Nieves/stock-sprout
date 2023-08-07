// prettier-ignore
import { getRandomTicker, getDescription, finParamFromAPI, 
        checkComp, sendStockToServer} from "./serverConnect.js";
// prettier-ignore
import {moneyFormat, ShowMessage, userLoggedIn, updateBrowserHistory, 
        RedGreenText, blurAllFields, truncate, MakeCapitalized} from './helpers.js';

const mainView = document.querySelector("#portfolio-view");
const topView = document.querySelector("#summary-row-top");
const compView = document.querySelector("#company-view");
const histView = document.querySelector("#history-view");
const hiddenForm = document.querySelector("#hidden-buy-form");
const bigBuyBtn = document.querySelector(".big-green-btn");
const searchField = document.querySelector("#comp-search");
const eps = document.querySelector("#company-eps");
const pe = document.querySelector("#company-pe");
const fpe = document.querySelector("#company-fpe");
const pb = document.querySelector("#company-pb");
const roe = document.querySelector("#company-roe");
const debt = document.querySelector("#company-debt");
const profitMargins = document.querySelector("#company-profitMargins");
const dividends = document.querySelector("#company-dividends");
const divPer = document.querySelector("#company-dividends-yield");
const desc = document.querySelector("#company-desc");
const compTitle = document.querySelector("#company-title");
const compTicker = document.querySelector("#comp-ticker");
const compPrice = document.querySelector("#res-comp-price");
const compDay = document.querySelector("#res-comp-day");
const compAvPr200 = document.querySelector("#comp-avPr200");
const targPer = document.querySelector("#comp-target-per");

export function showComp_link() {
  if (userLoggedIn()) {
    hiddenForm.style.display = "none";
    bigBuyBtn.style.display = "block";
  }
  show_company("random");
}

export function showComp_CompSearch() {
  const compName = searchField.value.toUpperCase();
  if (compName === "") return;
  searchField.value = "";
  hiddenForm.style.display = "none";
  userLoggedIn() && (bigBuyBtn.style.display = "block");
  show_company(compName);
}

export async function show_company(compName) {
  mainView.style.display = "none";
  topView.style.display = "none";
  compView.style.display = "block";
  userLoggedIn() && (histView.style.display = "none");
  blurAllFields(true);
  try {
    compName === "random" && (compName = await getRandomTicker());
    let data = await checkComp(compName);
    // if no such company:
    if (typeof data === "string") {
      ShowMessage(data);
      return;
    }
    comp_fillName(data);
    comp_fillPrice(data);
    comp_fillAvPr200(data);
    await comp_fillRest(data);
    updateBrowserHistory(`/company/${compName}`);
  } catch (err) {
    console.error("Can't show data for", compName, err.message);
  } finally {
    blurAllFields(false);
  }
}

async function comp_fillRest(data) {
  data.exchange !== "MOEX" && (data.desc = await getDescription(data.symbol));
  fillFinParams(data);
  eps.innerHTML = data.eps || "-";
  comp_fillDesc(data.desc || "No description");
}

async function fillFinParams(data) {
  // prettier-ignore
  document.querySelectorAll(".finParam").forEach((field) => (field.innerHTML = ""));
  if (data.exchange === "MOEX") return;
  try {
    const company = await finParamFromAPI(data.symbol);
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
    userLoggedIn() &&
      bigBuyBtn.addEventListener("click", () => activateBuyForm(data.symbol));
  } catch (err) {
    // prettier-ignore
    console.error("Financial parameters count's be filled for", compName, err.message);
  }
}

function comp_fillDesc(fullText) {
  desc.innerHTML = truncate(fullText, 600);
  let collapsed = true;
  desc.addEventListener("click", () => {
    desc.innerHTML = collapsed ? fullText : truncate(fullText, 600);
    collapsed = !collapsed;
  });
}

function comp_fillName(data) {
  compTitle.innerHTML = MakeCapitalized(data.name);
  compTicker.innerHTML = data.symbol;
}

function comp_fillPrice(data) {
  const valuePer = data.changesPercentage?.toFixed(1);
  compPrice.innerHTML = moneyFormat(data.price, 2);
  compDay.innerHTML = `${valuePer || "-"} % `;
  compDay.className = `med-text ${RedGreenText(valuePer)}`;
}

function comp_fillAvPr200(data) {
  let potential = (data.priceAvg200 / data.price - 1) * 100 || 0;
  compAvPr200.innerHTML = moneyFormat(data.priceAvg200, 2);
  targPer.innerHTML = `${potential.toFixed(1)} %`;
  targPer.className = `med-text ${RedGreenText(potential)}`;
}

async function activateBuyForm(ticker) {
  try {
    let data = await checkComp(ticker);
    sendStockToServer(data);
    bigBuyBtn.style.display = "none";
    hiddenForm.style.display = "block";
    hiddenForm.style.animationPlayState = "running";
  } catch (err) {
    console.error("Buy form can't be activated", err.message);
  }
}
