# Stock Sprout
## URL: [stock-sprout.onrender.com](https://stock-sprout.onrender.com/)

## Description:
Stock Sprout is a Django-JS web application used for stock exchange monitoring. Users can create their portfolio, adding stocks via Fetch API, update stock prices in the real time.
Users can also research any company's metrics (*like PE, PB, Dividends, etc.*) on the **Companies' page** and look at the transactions log on the **History page**.
Stock Sprout is the *single-page application*.


#App structure:
## Register and Login pages
Unauthorized user is able to search for companies’ financial metrics and nothing else. Login and register pages allow users to create their accounts on Stock Sprout or login using social media (GitHub or Google) accounts.

## Index view
On the top of the main view user can find 4 cells with general portfolio information:
- **Invested amount $**
- **Current amount $**
- **Change in the invested funds %**
- **Profit** value, which is money difference between Invested and Current + all dividends and deals profits from before
- **Day change** of one's portfolio in $ and %

Next is the *search field*. User can fill in a company's ticker or name to see its name, price and analytics’ Target Price and Analysis. When the company is searched UI will show "buy" and "sell" buttons, alongside two fields for the deal's price and amount.
Stock Sprout is not a broker, so a user can *"buy"* a stock for any price, which allows to add their old deals to the table. Other method of using the app is to create a test portfolio for beginners in investment.

Once bought, stocks are added to the user's DB and main-table. Update button allow user to update all his stocks's prices and overall profit value on click.

Main table can be ordered up and down by clicking *Sigma* (Sum), *Change* or *Company* headers, which are underlined.

Each row of the table contains main information about the deal and the company. By clicking it or by clicking the filled search box the user will be shown the...

## Company view 
On this view user can find information on any company and add it to their portfolio. Several fetch API requests will provide all needed information.

Page contains the company's name, price, brief description and its main financial parameters. 

*"Random"* button will quickly display one company from the site's DB and *"Search"* form will display the company's data by name or ticker.

## History view
Contains History table, in which all deals appear in reverse chronological order. *Buy* deals change **My Price** parameter and *Sell* deals generate **Profit**. Table's row also lead to the company's page.

This view also contains **Dividend form**. When it's filled and submitted, a new row will appear in the History table and the dividends amount will be added to overall profits of the portfolio.
