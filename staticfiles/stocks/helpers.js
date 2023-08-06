export function moneyFormat(number, digits = 0) {
  const options = {
    style: "currency",
    currency: "USD",
    CurrencyDisplay: "narrowSymbol",
    maximumFractionDigits: digits,
  };
  const formatted = new Intl.NumberFormat("en-US", options)
    .format(+number)
    .replace(",", " ");
  return isNaN(+number) ? "-" : formatted;
}

export function capitalizeName() {
  if (!userLoggedIn()) return;
  const name = document.querySelector(".username");
  let myName = name.innerHTML;
  name.innerHTML = MakeCapitalized(myName);
}
export function MakeCapitalized(string) {
  const low = string.toLowerCase();
  let converted = low.at(0).toUpperCase() + low.slice(1);
  const separators = [" ", "&", "-"];
  let capitalized = "";
  let next;
  for (const char of converted) {
    capitalized += next ? char.toUpperCase() : char;
    next = false;
    separators.includes(char) && (next = true);
  }
  return capitalized;
}

export function truncate(string, length) {
  return string.length > length ? `${string.substr(0, length)}...` : string;
}

export function checkMessages() {
  const message = document.querySelector("#message");
  if (message) ShowMessage(message.innerHTML);
}

export function ShowMessage(text) {
  let url = window.location.href;
  if (url.includes("company") || url.includes("history")) {
    ShowMessageDialog(text);
  } else {
    ShowMessageSearchBox(text);
  }
}

function ShowMessageDialog(text) {
  const dialog = document.querySelector("#modal-messenger");
  dialog.showModal();
  const message = document.querySelector("#modal-message");
  message.innerHTML = text;
  setTimeout(() => {
    dialog.close();
  }, 2000);
}

function ShowMessageSearchBox(text) {
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

export function blurAllFields(bool) {
  if (bool) document.querySelector(".big-loader").classList.remove("hidden");
  else document.querySelector(".big-loader").classList.add("hidden");
  const blurList = [
    "#company-title",
    "#company-desc",
    ".company-price-row",
    "#hidden-buy-form",
    "#comp-ticker",
  ];
  for (const element of blurList) {
    document.querySelector(element).style.filter = bool
      ? "blur(5px)"
      : "blur(0)";
  }
  const sumRows = document.querySelectorAll(".summary-row");
  sumRows.forEach(
    (item) => (item.style.filter = bool ? "blur(5px)" : "blur(0)")
  );
}

export const userLoggedIn = () => localStorage.getItem("loggedIn") === "true";

export function Timer(action) {
  if (action == "stop") {
    localStorage.removeItem("countdown");
    return;
  }
  let countdown;
  // localStorage is set in index.html
  if (localStorage.getItem("countdown") !== null)
    countdown = localStorage.getItem("countdown");
  const timer = document.getElementById("time");
  if (timer !== null && localStorage.getItem("countdown") !== null) {
    const update = setInterval(function () {
      let minutes = String(Math.trunc(countdown / 60)).padStart(2, 0);
      let seconds = String(countdown % 60).padStart(2, 0);
      timer.innerHTML = `${minutes}:${seconds}`;
      localStorage.setItem("countdown", countdown);
      if (countdown === 0) {
        clearInterval(update);
        localStorage.removeItem("countdown");
        fetch("/logout");
        ShowMessage("Logged out");
        setTimeout(() => {
          location.reload();
        }, 1500);
      }
      countdown--;
    }, 1000);
  }
}

// prettier-ignore
export const updateBrowserHistory = (str) => window.history.pushState("_", "_", str);

export const RedGreenText = (param) => (param < 0 ? "red-text" : "green-text");
