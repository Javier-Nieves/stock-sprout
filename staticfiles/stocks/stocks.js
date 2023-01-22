document.addEventListener('DOMContentLoaded', function() {

  // ? what's clicked?
  document.addEventListener('click', event => {
    tar = event.target;
    let ClName = tar.parentElement.className;

    // ! Companies view
    // * from History
    if (ClName.includes("hist-row")) {
      if (tar.parentElement.querySelector('.hist-action').innerHTML != 'Div') {
        var name = tar.parentElement.querySelector('#hist-company-name').innerHTML;
        show_company(name);
      }
    }
    // * from Main Table Index
    if (ClName.includes("table-row")) {
      var name = tar.parentElement.querySelector('#company-ticker').innerHTML;
      show_company(name);
    }
    // * by link on top
    if (tar.className.includes("companies-btn")) {
      var name = 'random';
      document.querySelector('#hidden-buy-form').style.display = 'none';
      try {
        document.querySelector('.big-green-btn').style.display = 'block';
      }
      catch{}
      show_company(name);
    }
    // * from search button in Index
    if (tar.parentElement.parentElement.className.includes("ticker-link")) {
      var name = document.querySelector('#hidden-ticker').value;
      console.log(name);
      show_company(name);
    }
    // * company search button in Company View
    if (tar.className.includes("comp-search-btn")) {
      let tick = document.querySelector("#comp-search").value.toUpperCase();
      document.querySelector("#comp-search").value = '';
      document.querySelector('#hidden-buy-form').style.display = 'none';
      document.querySelector('.big-green-btn').style.display = 'block';
      show_company(tick);
    }

    // ! History view
    if (tar.className.includes('history-btn')) {
      document.querySelector('#portfolio-view').style.display = 'none';
      document.querySelector('#summary-row-top').style.display = 'flex';
      document.querySelector('#history-view').style.display = 'block';
      document.querySelector('#company-view').style.display = 'none';

    let HistRows = document.querySelectorAll('.hist-row');
    HistRows.forEach(Item => {
      if (Item.querySelector('.hist-action').innerHTML == "Buy") {
        // console.log("buy");
        Item.querySelector('.hist-sell').innerHTML = "-";
      }
      else if (Item.querySelector('.hist-action').innerHTML == "Sell") {
        Item.querySelector('.hist-buy').innerHTML = "-";
        Item.style.backgroundColor = 'rgba(126, 21, 218, 0.08)';
      }
      else if (Item.querySelector('.hist-action').innerHTML == "Div") {
        Item.querySelector('.hist-buy').innerHTML = "-";
        Item.querySelector('.hist-amount').innerHTML = "-";
        Item.querySelector('.hist-price').innerHTML = "-";
        Item.querySelector('#hist-profit').innerHTML = Item.querySelector('.hist-sell').innerHTML;
        Item.querySelector('#hist-profit').style.color = 'rgba(78, 235, 0, 0.908)';
        Item.querySelector('.hist-sell').innerHTML = "-";
        Item.style.backgroundColor = 'rgba(255, 205, 4, 0.165)';
      }
    })
    }
  })

    // ! Top 5 columns information
    let rows = document.querySelectorAll('.table-row');
    let sum1 = 0;
    let sum2 = 0;
    let dayCh = 0;

    rows.forEach(Item => {
      let myPr = parseFloat(Item.querySelector('.my-price-row').innerHTML);
      let Qu = parseFloat(Item.querySelector('.quantity-row').innerHTML);
      let Si = parseFloat(Item.querySelector('.sigma-row').innerHTML);
      let dayOne = parseFloat(Item.querySelector('#day-one').innerHTML);

      sum1 += myPr * Qu;
      sum2 += Si;
      dayCh += Si / (100 + dayOne) * 100;

    });
    let dayChMoney = parseFloat(sum2 - dayCh).toFixed(1);
    dayCh = parseFloat((sum2 / dayCh - 1) * 100).toFixed(2);
    // ? next line will do a toNumber conversion and provide a default value if dayCh = NaN
    dayCh = +dayCh || 0;

    sum1 = parseFloat(sum1).toFixed();
    sum2 = parseFloat(sum2).toFixed();
    let a = parseFloat((sum2/sum1 - 1) * 100).toFixed(1);
    a = +a || 0;
    let hidProfit = parseFloat(document.querySelector('#hidden-profit').value);
    prof = parseFloat(sum2 - sum1 + hidProfit).toFixed();

    try {
    document.querySelector('#invested-main').innerHTML = `<div class="sum-text"> Invested: </div> <div class="sum-value">$ ${ moneyFormat(sum1) } </div>`;
    document.querySelector('#present-main').innerHTML = `<div class="sum-text"> Now: </div> <div class="sum-value"> $ ${ moneyFormat(sum2) } </div>`;
    
    if (a >= 0) {
      document.querySelector('#percent-main').innerHTML = `<div class="sum-text"> Change: </div> <div class="green-text sum-value"> ${ a } % </div>`;
    }
    else {
      document.querySelector('#percent-main').innerHTML = `<div class="sum-text"> Change: </div> <div class="red-text sum-value"> ${ a } % </div>`;
    }

    if (sum2 - sum1 + hidProfit >= 0) {
      document.querySelector('#profit-main').innerHTML = `<div class="sum-text"> Profit: </div> <div class="green-text sum-value"> $ ${ moneyFormat(prof) } </div>`;
    }
    else {
      document.querySelector('#profit-main').innerHTML = `<div class="sum-text"> Profit: </div> <div class="red-text sum-value"> $ ${ moneyFormat(prof) } </div>`;
    }

    if (dayChMoney >= 0) {
      document.querySelector('#day-main').innerHTML = `<div class="sum-text"> Day change: </div> <div class="green-text sum-value">$ ${dayChMoney} &nbsp ${dayCh} % </div>`;
    }
    else {
      document.querySelector('#day-main').innerHTML = `<div class="sum-text"> Day change: </div> <div class="red-text sum-value">$ ${dayChMoney} &nbsp ${dayCh} % </div>`;
    }

    }
    catch {}
    
    // ! sorting
    document.addEventListener('click', event => {
      let SortParam, table, rows, switching, i, x, y, shouldSwitch;
      sortTar = event.target;
      // which parameter will sort the table
      let whichSort = sortTar.className;
      table = document.getElementById("mainTable");
      switching = true;
      while (switching) {
        switching = false;
        rows = table.rows;
        for (i = 1; i < (rows.length - 1); i++) {
          shouldSwitch = false;
          // * parameter determination
          if (whichSort.includes('sortSigma')) {
          x = rows[i].querySelector(".sigma-row").innerHTML;
          y = rows[i + 1].querySelector(".sigma-row").innerHTML;
          }
          else if (whichSort.includes('sortChange')) {
            x = rows[i].querySelector("#change-field").innerHTML;
            y = rows[i + 1].querySelector("#change-field").innerHTML;
          }
          else if (whichSort.includes('sortDay')) {
            x = rows[i].querySelector("#day-one").innerHTML;
            y = rows[i + 1].querySelector("#day-one").innerHTML;
          }

          // * direction determination
          if (whichSort.includes('Up')) {
            if (parseFloat(x) < parseFloat(y)) {
              shouldSwitch = true;
              break;
            }
          }
          else if (whichSort.includes('Down')) {
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
      // * switch class after sorting in main table
      if (whichSort.includes('Up')) {
        sortTar.classList.replace("Up", "Down");
      }
      else {
        sortTar.classList.replace("Down", "Up");
      }
    })

    try {
      // * if company is searched - make Search field clickable and Buy button appear
      if (document.querySelector('#check-filled').innerHTML != '') {
        let items = document.querySelector('.ticker-search-container').className = 'ticker-link';
        document.getElementById("action-buttons").style.animationPlayState = "running";
      }
    }
    catch{}


    // ! Dividend form handling
    try{
      let form = document.getElementById("Div-form");
      function submitForm(event){
        event.preventDefault();
        let title = document.querySelector("#Div-title").value;
        let amount = document.querySelector("#Div-amount").value;
        // make a call to back-end to add this dividend to the DB
        fetch(`/history/${title}/${amount}`)

          // creatig new row in table on 1st position
          let HistRow = document.querySelector('#HistTable').insertRow(0);
          HistRow.className = 'new-hist-row';
          HistRow.style.backgroundColor = 'rgba(255, 205, 4, 0.165)';
          var cell1 = HistRow.insertCell(0);
          var cell2 = HistRow.insertCell(1);
          var cell3 = HistRow.insertCell(2);
          var cell4 = HistRow.insertCell(3);
          var cell5 = HistRow.insertCell(4);
          var cell6 = HistRow.insertCell(5);
          var cell7 = HistRow.insertCell(6);
          var cell8 = HistRow.insertCell(7);
          cell1.innerHTML = "DIV";
          cell2.innerHTML = `${title}`;
          cell3.innerHTML = "Div";
          cell4.innerHTML = "-";
          cell5.innerHTML = "-";
          cell6.innerHTML = "-";
          cell7.innerHTML = "-";
          cell8.innerHTML = `${amount}`;
          cell8.className = "green-text";
          HistRow.style.animationPlayState = 'running';

          form.reset();
          ShowMessage('Dividends received');
      }
      form.addEventListener('submit', submitForm);
    }
    catch{}
})

// ! --- functions ----

    // * for alerts to disappear
    setTimeout(function(){
      try{
        let mes = document.getElementById("message");
        mes.style.animationPlayState = "running";
        setTimeout(function(){
          mes.remove();
        }, 2000);
      } 
      catch{}
    }, 3000);  // in 3 sec  


function show_company (name) {
  document.querySelector('#portfolio-view').style.display = 'none';
  try{document.querySelector('#summary-row-top').style.display = 'none';
  document.querySelector('#history-view').style.display = 'none';}
  catch{}
  document.querySelector('#company-view').style.display = 'block';
  fetch(`/companies/${name}`)
    .then(response => response.json())
    .then(result => {
      // console.log(comp)
      if (result.message) {
          ShowMessage(`${result.message}`);
      }
      let roe = result.comp.roe * 100;
      let yield = result.comp.dividends / result.comp.price * 100;
      let marg = result.comp.profitMargins * 100;
      let potential = (result.comp.targetPrice / result.comp.price - 1) * 100;

      if (result.comp.day > 0) {
        document.querySelector('#company-price').innerHTML = `
        <div style='display:flex; align-items: center;'>
          <div>
            <div class="comp-param-text"> Price: </div> 
            <div class="comp-param-value-big" style="margin-left: 3vw;">
              <div>$ ${result.comp.price.toFixed(2)}</div> 
              <div class='green-text med-text'>${result.comp.day.toFixed(1)} % </div>
            </div>
          </div>
          <button class="big-green-btn">Buy</button>
        </div>`;
      }
      else {
        document.querySelector('#company-price').innerHTML = `
        <div style='display:flex; align-items: center;'>
          <div>
            <div class="comp-param-text"> Price: </div> 
            <div class="comp-param-value-big" style="margin-left: 3vw;">
              <div>$ ${result.comp.price.toFixed(2)}</div> 
              <div class='red-text med-text'>${result.comp.day.toFixed(1)} % </div>
            </div>
          </div>
          <button class="big-green-btn">Buy</button>
        </div>`;
      }

      if (potential > 0) {
        document.querySelector('#company-targetPrice').innerHTML = `<div class="comp-param-text"> Target price: </div> <div class="comp-param-value-big">$ ${result.comp.targetPrice.toFixed(2)} <div class='green-text med-text'>${potential.toFixed(1)} % </div></div>`;
      }
      else {
        document.querySelector('#company-targetPrice').innerHTML = `<div class="comp-param-text"> Target price: </div> <div class="comp-param-value-big">$ ${result.comp.targetPrice.toFixed(2)} <div class='red-text med-text'>${potential.toFixed(1)} % </div></div>`;
      }

      // populate forms with company's data 
      document.querySelector('#hidden-ticker-comp').value = result.comp.ticker;
      document.querySelector('#company-recom').innerHTML = `<div class="comp-param-text"> Recommendation: </div> <div class="comp-param-value-big">${result.comp.recom} </div>`;
      document.querySelector('#company-title').innerHTML = `${MakeCapitalized(result.comp.company)} <div class='comp-param-text' style='text-align:center;'>${result.comp.ticker}</div>`;
      var fullText = result.comp.desc;
      var par = true;
      document.querySelector('#company-desc').innerHTML = truncate(fullText, 600);
        document.querySelector('#company-desc').addEventListener('click', () => {
          if (par) {
            document.querySelector('#company-desc').innerHTML = fullText;
            par = false;
          }
          else {
            document.querySelector('#company-desc').innerHTML = truncate(fullText, 600);
            par = true;
          }
        });
      try {
      document.querySelector('#company-pe').innerHTML = `<div class="comp-param-text"> PE: </div> <div class="comp-param-value">${result.comp.pe.toFixed(1)} </div>`;
      document.querySelector('#company-fpe').innerHTML = `<div class="comp-param-text"> Forward PE: </div> <div class="comp-param-value">${result.comp.fpe.toFixed(1)}</div>`;
      document.querySelector('#company-pb').innerHTML = `<div class="comp-param-text"> PB: </div> <div class="comp-param-value">${result.comp.pb.toFixed(1)}</div>`;
      document.querySelector('#company-roe').innerHTML = `<div class="comp-param-text"> ROE: </div> <div class="comp-param-value">${roe.toFixed(1)} %</div>`;
      document.querySelector('#company-debt').innerHTML = `<div class="comp-param-text"> Debt to Equity: </div> <div class="comp-param-value">${result.comp.debt.toFixed(2)}</div>`;
      document.querySelector('#company-profitMargins').innerHTML = `<div class="comp-param-text"> Profit Margins: </div> <div class="comp-param-value">${marg.toFixed(1)} %</div>`;
      document.querySelector('#company-dividends').innerHTML = `<div class="comp-param-text"> Dividends: </div> <div class="comp-param-value">$ ${result.comp.dividends.toFixed(2)}</div>`;
      document.querySelector('#company-dividends-yield').innerHTML = `<div class="comp-param-text"> Dividends yield: </div> <div class="comp-param-value"> ${yield.toFixed(1)} %</div>`;
      }
      catch{}

      document.querySelector('.big-green-btn').addEventListener('click', () => {
        document.querySelector('#hidden-buy-form').style.display = 'block';
        document.querySelector('.big-green-btn').style.display = 'none';
        document.querySelector('#hidden-buy-form').style.animationPlayState = "running";
      })

    })

  }

  function moneyFormat(string) {
    let changed = string.toString();
    if (3 < changed.length < 7) {
      txt = changed.slice(0,-3) + " " + changed.slice(-3);
    }
    return txt
  }

  function MakeCapitalized(string) {
    var low = string.toLowerCase();
    var converted = low.charAt(0).toUpperCase() + low.slice(1);
    for (let i=0; i<string.length; i++) {
        if (converted.charAt(i) === ' ' || converted.charAt(i) === '&' || converted.charAt(i) === '-') {
          converted = converted.slice(0,i+1) + converted.charAt(i+1).toUpperCase() + converted.slice(i+2);
        }
    }
    return converted
  }

  function truncate(str, length) {
    return str.length > length
      ? `${str.substr(0, length)}...`
      : str;
  }

  function ShowMessage(text) {
    let success_msg = document.createElement('a');
          success_msg.className = "message-buy";
          success_msg.id = 'message';
          success_msg.innerHTML = `-= ${text} =-`;
          document.querySelector(".left-group").append(success_msg);
          setTimeout(function(){
            success_msg.style.animationPlayState = "running";
          }, 3000);
          setTimeout(function(){
          success_msg.remove();
          }, 4800);
  }