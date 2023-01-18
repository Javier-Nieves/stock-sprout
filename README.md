# Stock Sprout
## URL: [stock-sprout.onrender.com](stock-sprout.onrender.com)
#### Video Demo: [https://youtu.be/HFDE5aihhmA](https://youtu.be/HFDE5aihhmA)

## Description:
Stock Sprout is a Django-JS web application used for stock exchange monitoring. Users can create their portfolio, adding stocks via API (from Yahoo Finance), stocks’ **prices will update automatically** and day and overall price changes will be displayed in the table on the main page.
Users can also research any company's metrics (*like PE, PB, Dividends, etc.*) on the **Companies' page** and look at the transactions log on the **History page**.
All functions and views except login and register are parts of the *single-page application* made with JS. Backend is Django with 5 models and 2 forms, database is PostgreSQL.

## Distinctiveness and Complexity
Stock Sprout is an app about stock exchange and companies’ financial data, which wasn’t covered in CS50w course. Unlike other projects a user here is a receiver and analyzer or information, they don’t send letters, neither they post texts or items for sale. The user gathers financial data and forms a personal investment portfolio. The app also uses Python requests module to send API’s and not JS as in other projects.

#### Speaking of complexity: 
1. Application is made in single-page format, which is good practice nowadays and is more complex than ordinary multi-pages app. 
2.	Application is deployed and operates online, not in IDE.
3.	Automatic stocks/companies updates are implemented and operate in a scalable fashion (API requests per account are minimized).
4.	API’s are more complex than before and collect many parameters from 3 different routes.
5.	The project uses Django forms and PostgreSQL database instead of SQLite and simple forms.
6.	In Python code GET and POST method are separated by decorators, 4+1 DB models and serialization are used.
7.	On the part of JS – app is created dynamically, “fetch” is used to communicate with a backend, dividends on the history view are added without reloading the page.
8.	On the part of CSS – animation is used in multiple places, app is mobile-responsive.
9.	HTML also changes for different conditions, depending on authentication and also whether the user has an empty portfolio or not.

## Files
Stock Sprout is a Django application with one app - *Stocks*, so the main structure is standard: models.py for DB models, views.py for main Python code, urls.py for url patterns and two API routes. Admin.py contains all 5 database models.
In the Templates subfolder 4 HTML templates are located, which are:
1.	Index.html with all the main views
2.	Login.html for separate login page
3.	Register.html for separate register page
4.	Layout.html for base template, on which every other one is based.

Settings.py is configurated for production – Secret key is hidden in environment variable, debug is set to "False" and Database is set to work with online PostgreSQL DB.

Staticfiles folder and build.sh script are needed to online deployment. The folder contains all media materials, CSS stylesheet and JS script file Stocks.JS. 

Application is operating online on [stock-sprout.onrender.com](stock-sprout.onrender.com). 
But to run it from IDE one must:
1.	Create **.env** file in the project’s main directory with environment variable SECRET_KEY = 'any_random_value'.
2.	Type ‘python manage.py runserver’ as usual

#App structure:
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
