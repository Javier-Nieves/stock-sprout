import { changeDivName, SendDivToDB } from "./serverConnect.js";
import { ShowMessage } from "./helpers.js";

export function showingHistory() {
  document.querySelector("#portfolio-view").style.display = "none";
  document.querySelector("#summary-row-top").style.display = "flex";
  document.querySelector("#history-view").style.display = "block";
  document.querySelector("#company-view").style.display = "none";
  let HistRows = document.querySelectorAll(".hist-row");
  HistRows.forEach((Row) => changeHistRow(Row));
  // change div title when clicked:  (using event delegation)
  document
    .querySelector("#HistTable")
    .addEventListener("click", (e) =>
      e.target.classList.contains("div-title")
    ) && changeDivName(e.target.closest("tr"));
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

export const activateDivForm = () =>
  document.getElementById("Div-form").addEventListener("submit", getDividend); //todo - event is needed?

async function getDividend(event) {
  try {
    event.preventDefault();
    const title = document.querySelector("#Div-title").value;
    const amount = document.querySelector("#Div-amount").value;
    const data = await SendDivToDB(title, amount);
    const newEntryId = data.id;
    const HistRow = createNewHistRow(title, amount);
    makeDivCellChangable(HistRow, newEntryId);
    updateProfits(amount);
    document.getElementById("Div-form").reset();
    ShowMessage("Dividends received");
  } catch (err) {
    console.error("Can't get dividends!", err.message);
  }
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
