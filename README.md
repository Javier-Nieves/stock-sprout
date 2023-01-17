# Stock Sprout
## URL: [stock-sprout.onrender.com](stock-sprout.onrender.com)
#### Video Demo: [https://youtu.be/HFDE5aihhmA](https://youtu.be/HFDE5aihhmA)

## Description:
Stock Sprout is a Django-JS web application used for stock exchange monitoring. Users can create their portfolio, adding stocks via API (from Yahoo Finance), stocks’ **prices will update automatically** and day and overall price changes will be displayed in the table on the main page.
Users can also research any company's metrics (*like PE, PB, Dividends, etc.*) on the **Companies' page** and look at the transactions log on the **History page**.

All functions and views except login and register are parts of the *single-page application* made with JS. Backend is Django with 5 models and 2 forms, database is PostgreSQL.

## Register and Login pages
Unauthorized user is able to search for companies’ financial metrics and nothing else. Login and register pages allow users to create their accounts on Stock Sprout.
The pages are pretty basic, frontend forbid empty fields, while backend checks user uniqueness and password-confirmation match.

## Index view
On the top of the main view user can find 5 cells with general portfolio information:
- **Invested amount $**
- **Current amount $**
- **Change between first two columns %**
- **Profit** value, which is money difference between Invested and Current + all dividends and deals profits from before
- **Day change** of one's portfolio in $ and %

Next is the *search field*. User can fill in a company's ticker to see its name, price and analytics’ Target Price and Analysis. When the company is searched UI will show "buy" and "sell" buttons, alongside two fields for the deal's price and amount.
Stock Sprout is not a broker, so a user can *"buy"* a stock for any price, which allows to add their old deals to the table. Other method of using the app is to create a test portfolio for beginners in investment.

Once bought, stocks are added to the user's DB and main-table. Companies' metrics are updated once in 120 seconds and will be displayed in the table upon refreshing the page. Top 5 cells will be automatically updated as well.

Main table can be ordered up and down by clicking *Sigma* (Sum), *Change* or *Company* headers, which are underlined.

Each row of the table contains main information about the deal and the company. By clicking it or by clicking the filled search box the user will be shown the...

## Company view 
On this view user can find information on any company. If it exists in the site's database, the user will be shown the information right away, otherwise API request will provide the information more slowly.

Page contains the company's name, brief description and its main financial parameters. 

*"Random"* button will quickly display one company from the site's DB and *"Search"* form will display the company's data by ticker.

## History view
Contains History table, in which all deals appear in reverse chronological order. *Buy* deals change **My Price** parameter and *Sell* deals generate **Profit**. Table's row also lead to the company's page.

This view also contains **Dividend form**. When it's filled and submitted, a new row will appear in the History table and the dividends amount will be added to overall profits of the portfolio. "Title" of the dividend may not be a company's name or ticker. Any origin is accepted, like **"December's dividends"**, for example.
