// prettier-ignore
import { getRandomTicker, getDescription, finParamFromAPI, 
        checkComp, sendStockToServer} from "./serverConnect.js";
// prettier-ignore
import {moneyFormat, ShowMessage, userLoggedIn, updateBrowserHistory, 
        RedGreenText, blurAllFields, truncate, MakeCapitalized} from './helpers.js';

export function showComp_link() {
  if (userLoggedIn()) {
    document.querySelector("#hidden-buy-form").style.display = "none";
    document.querySelector(".big-green-btn").style.display = "block";
  }
  show_company("random");
}

export function showComp_CompSearch() {
  const compName = document.querySelector("#comp-search").value.toUpperCase();
  if (compName === "") return;
  document.querySelector("#comp-search").value = "";
  document.querySelector("#hidden-buy-form").style.display = "none";
  userLoggedIn() &&
    (document.querySelector(".big-green-btn").style.display = "block");
  show_company(compName);
}

export async function show_company(compName) {
  document.querySelector("#portfolio-view").style.display = "none";
  document.querySelector("#summary-row-top").style.display = "none";
  document.querySelector("#company-view").style.display = "block";
  userLoggedIn() &&
    (document.querySelector("#history-view").style.display = "none");
  blurAllFields(true);
  try {
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
  } catch (err) {
    console.error("Can't show data for", compName, err.message);
  }
}

async function comp_fillRest(data) {
  data.exchange !== "MOEX" && (data.desc = await getDescription(data.symbol));
  fillFinParams(data);
  document.querySelector("#company-eps").innerHTML = data.eps || "-";
  comp_fillDesc(data.desc || "No description");
}

async function fillFinParams(data) {
  const allFields = document.querySelectorAll(".finParam");
  allFields.forEach((field) => (field.innerHTML = ""));
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
      button.addEventListener("click", () => activateBuyForm(data.symbol));
  } catch (err) {
    // prettier-ignore
    console.error("Financial parameters count's be filled for", compName, err.message);
  }
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
  // prettier-ignore
  document.querySelector("#company-title").innerHTML = MakeCapitalized(data.name);
  document.querySelector("#comp-ticker").innerHTML = data.symbol;
  document.querySelector("#hidden-ticker-comp").value = data.symbol;
}
function comp_fillPrice(data) {
  // prettier-ignore
  document.querySelector("#res-comp-price").innerHTML = moneyFormat(data.price, 2);
  const resComDay = document.querySelector("#res-comp-day");
  const valuePer = data.changesPercentage?.toFixed(1);
  resComDay.innerHTML = `${valuePer || "-"} % `;
  resComDay.className = `med-text ${RedGreenText(valuePer)}`;
}
function comp_fillAvPr200(data) {
  let potential = (data.priceAvg200 / data.price - 1) * 100 || 0;
  // prettier-ignore
  document.querySelector("#comp-target-dol").innerHTML = moneyFormat(data.priceAvg200,2);
  const targPer = document.querySelector("#comp-target-per");
  targPer.innerHTML = `${potential.toFixed(1)} %`;
  targPer.className = `med-text ${RedGreenText(potential)}`;
}

async function activateBuyForm(ticker) {
  try {
    let data = await checkComp(ticker);
    sendStockToServer(data);
    const buyForm = document.querySelector("#hidden-buy-form");
    document.querySelector(".big-green-btn").style.display = "none";
    buyForm.style.display = "block";
    buyForm.style.animationPlayState = "running";
  } catch (err) {
    console.error("Buy form can't be activated", err.message);
  }
}
