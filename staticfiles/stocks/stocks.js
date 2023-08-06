// prettier-ignore
import {capitalizeName, checkMessages, userLoggedIn, Timer, updateBrowserHistory} from './helpers.js';
// prettier-ignore
import {show_company, showComp_link, showComp_CompSearch, } from './companies.js';
import { AuthCheck } from "./serverConnect.js";
import { showingMain } from "./mainView.js";
import { showingHistory, activateDivForm } from "./history.js";
import { fillTopInfo } from "./topInfo.js";
import { sortTable } from "./sorting.js";

try {
  const loggedIn = await AuthCheck();
  localStorage.setItem("loggedIn", loggedIn);
  checkMessages();
  loadCorrectView();
  capitalizeName();
  handleClicks();
  loggedIn && fillTopInfo();
  loggedIn && activateDivForm();
  // browser back button action
  window.addEventListener("popstate", loadCorrectView);
} catch (err) {
  console.error("Loading sequence error", err.message);
}

function handleClicks() {
  // showing views
  const randomCompBtns = document.querySelectorAll(".companies-btn");
  const compSearchBtn = document.querySelector(".comp-search-btn");
  const portBtn = document.querySelector(".portfolio-btn");
  const histBtn = document.querySelector(".history-btn");
  const nodes = ["#mainTable", ".ticker-search-container"];
  userLoggedIn() && nodes.push("#HistTable");
  portBtn.addEventListener("click", showingMain);
  randomCompBtns.forEach((btn) => btn.addEventListener("click", showComp_link));
  compSearchBtn.addEventListener("click", showComp_CompSearch);
  userLoggedIn() && histBtn.addEventListener("click", showingHistory);
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
  // prettier-ignore
  if (url.includes("action") || url.includes("logout") || url.includes("login")) {
    updateBrowserHistory("/");
    userLoggedIn() && showingMain();
  }
  url.includes("company") && show_company(url.slice(url.lastIndexOf("/") + 1));
  url.includes("history") && showingHistory();
  url.slice(-1) === "/" && showingMain();
}
