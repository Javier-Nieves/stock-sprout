import { moneyFormat, RedGreenText } from "./helpers.js";
export function fillTopInfo() {
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
