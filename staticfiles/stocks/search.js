// prettier-ignore
import { ShowMessage, userLoggedIn } from "./helpers.js";
import { checkComp, sendStockToServer } from "./serverConnect.js";

export function searchFormFunction() {
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

async function fillFormWithData(compName) {
  const name = document.querySelector("#search-display-name");
  const price = document.querySelector("#search-display-price");
  const PE = document.querySelector("#search-display-PE");
  const avPr200 = document.querySelector("#search-display-avPr200");
  const container = document.querySelector(".ticker-search-container");
  let data = await checkComp(compName);
  try {
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
  } catch (err) {
    console.error("Error in getting company's data for", compName, err.message);
  }
}

function showActionBtns() {
  const seBox = document.querySelectorAll(".ticker-search-box");
  // todo - too much ticker-links?
  seBox.forEach((box) => box.classList.add("ticker-link"));
  document
    .querySelector(".ticker-search-container")
    .classList.add("ticker-link");
  userLoggedIn() &&
    (document.getElementById("action-buttons").style.animationPlayState =
      "running");
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
