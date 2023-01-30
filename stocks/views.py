import requests
import datetime
import random
from apscheduler.schedulers.background import BackgroundScheduler

from django.shortcuts import render
from django.contrib.auth import authenticate, login, logout
from django.views.decorators.http import require_POST
from django.db import IntegrityError
from django.http import HttpResponse, JsonResponse

from .forms import SearchForm, BuyForm
from .models import User, Stocks, MyPrice, Portfolio, History


def index(request, message=""):  # with default empty value for message
    search_form = SearchForm()
    buy_form = BuyForm()

    # ? does user have a portfolio?
    if request.user.is_authenticated:
        try:
            portfolio = Portfolio.objects.get(owner=request.user)
        except:
            Portfolio.objects.create(owner=request.user)
            portfolio = Portfolio.objects.get(owner=request.user)

        prices = MyPrice.objects.filter(investor=request.user)
        history = History.objects.filter(user=request.user)
        return render(request, 'stocks/index.html', {
            'search_form': search_form,
            'buyForm': buy_form,
            'portfolio': portfolio.stock.all(),
            'prices': prices,
            'history': history,
            'profit': portfolio.profit,
            'message': message
            })
    else:
        return render(request, 'stocks/index.html', {
            'search_form': search_form,
            'message': message
            })


@require_POST
def indexPost(request):
    search_form = SearchForm(request.POST)
    buy_form = BuyForm(request.POST)
    if request.user.is_authenticated:
        portfolio = Portfolio.objects.get(owner=request.user)
        prices = MyPrice.objects.filter(investor=request.user)
        history = History.objects.filter(user=request.user)

    # ! if ticker is being searched
    # check whether form is valid:
    if search_form.is_valid():
        # process the data in form.cleaned_data as required
        # geting ticker name
        ticker = search_form.cleaned_data['stock_ticker']
        # compData = all info about that ticker
        compData = checkStock(ticker)

        # if company name is entered - find it's ticker
        if compData == None:
            compData = checkStock(getTicker(ticker))
            if compData == None:
                return index(request, "Stock doesn't exist")

        buy_form = BuyForm()
        if request.user.is_authenticated:
            return render(request, 'stocks/index.html', {
            'search_form': search_form,
            'buyForm': buy_form,
            'compData': compData,
            'portfolio': portfolio.stock.all(),
            'prices': prices,
            'history': history,
            'profit': portfolio.profit
            })
        else: 
            return render(request, 'stocks/index.html', {
            'search_form': search_form,
            'buyForm': buy_form,
            'compData': compData
            })

    # ! BUY
    ticker = request.POST.get('hidden-ticker').upper()
    # if stock is being added to the portfolio
    if buy_form.is_valid():
        portfolio = Portfolio.objects.get(owner=request.user)
        amount = buy_form.cleaned_data['buy_amount']
        form_price = buy_form.cleaned_data['buy_price']
        # ! stock is being bought
        if 'buy_btn' in request.POST:
            # if the stock doesn't exist in the DB
            try: 
                Stocks.objects.get(ticker=ticker)
            except:
                # get API data for the ticker
                compData = checkStock(ticker)
                # ? create Stock db entry
                Stocks.objects.create(ticker=ticker, company=compData['company'], day=compData['day'], desc=compData['desc'], price=compData['price'], 
                pe=compData['pe'], fpe=compData['fpe'], pb=compData['pb'], debt=compData['debt'],roe=compData['roe'], profitMargins=compData['profitMargins'], 
                divs=compData['dividends'], targetPrice=compData['targetPrice'], recom=compData['recom'])

            # does User already have this stock?
            stock = Stocks.objects.get(ticker=ticker)

            if not stock in portfolio.stock.all():
                portfolio.stock.add(stock)

            # * MyPrice update
            if MyPrice.objects.filter(investor=request.user, stock=stock).exists():
                MP = MyPrice.objects.get(investor=request.user, stock=stock)
                MP.myPrice = (MP.myPrice * MP.quant + amount * form_price) / (MP.quant + amount)
                MP.quant += amount
                MP.save()
            else:
                MyPrice.objects.create(investor=request.user, stock=stock, quant=amount, myPrice=form_price)

            # * History update on buy
            MP = MyPrice.objects.get(investor=request.user, stock=stock)
            History.objects.create(user=request.user, stock=stock, ammount=amount, MyPriceHist=MP.myPrice, BPrice=form_price, action="Buy")

            return index(request, 'buy')

        # ! stock is being sold
        elif 'sell_btn' in request.POST:
            
            # is there such stock in the db?
            if Stocks.objects.filter(ticker=ticker).exists():
                
                # Does user have this stock?
                stock = Stocks.objects.get(ticker=ticker)
                if not stock in portfolio.stock.all():
                    return index(request, "You don't have this stock")
                
                # Does user have enough of this stock to sell
                MP = MyPrice.objects.get(investor=request.user, stock=stock)
                if amount > MP.quant:
                    return index(request, "You don't have enough lots")

                else:
                    MP.quant -= amount
                    portfolio.profit += amount * form_price - amount * MP.myPrice
                    portfolio.save()
                    MP.save()
                    # delete stock from portfolio if everything is sold
                    if MP.quant == 0:
                        portfolio.stock.remove(stock)
                        MP.delete()

                     # * History update on sell
                    History.objects.create(user=request.user, stock=stock, ammount=amount, SPrice=form_price, MyPriceHist=MP.myPrice, action="Sell")

                    return index(request, 'sell')

            else:
                return index(request, "You don't have this stock")
        else:
            return HttpResponse("<h1>How did you get here?</h1>")


def company_view(request, name):
    if checkStock(name) == None and name!="random":
        name = getTicker(name)
        if checkStock(name) == None:
            print('No such company!!!')
            return JsonResponse({
            "message": "No such company"
            }, status=200)

    # if Company View is summoned via top link - open random company from DB
    if name == 'random':
        name = 'DIV'
        while name == 'DIV':
            StockList = list(Stocks.objects.all())
            name = random.choice(StockList).ticker

    # ? if company exists in DB:
    try:
        # function returns company data in JSON form straight from the DB 
        comp = Stocks.objects.get(ticker=name).serialize()
        return JsonResponse({
            "comp": comp
            }, status=200)

    # ? for new companies
    except:
        return JsonResponse({
            "comp": checkStock(name)
            }, status=200)


def histPost(request, title, dividend):
    portfolio = Portfolio.objects.get(owner=request.user)
    # ?Django form was used previously, but form submittions reloads the page, so JS is used instead
    # div_form = DividendForm(request.POST)
    # if div_form.is_valid():
    #     title = div_form.cleaned_data['title']
    #     dividend = div_form.cleaned_data['dividend']
    stk = Stocks.objects.get(ticker="DIV")
    # ? create new dividend entry in DB
    History.objects.create(user=request.user, stock=stk, action="Div", SPrice=dividend, BPrice=0, MyPriceHist=0, ammount=0, note=title)
    portfolio.profit += dividend
    portfolio.save()

    return JsonResponse({'status':'false'}, status=204)
    # return index(request, 'Dividends received', status=204)

def histChange(request, ident, newText):
    # ? change the dividend entry in DB
    changing = History.objects.get(id=ident)
    changing.note = newText
    changing.save()

    return JsonResponse({'status':'false'}, status=204)


# ! ------------------ functions ---------------

# ! get company financial data by ticker (API function)
def checkStock(ticker):
    try:
        url = f"https://query1.finance.yahoo.com/v11/finance/quoteSummary/{ticker}?modules=financialData"
        urlComp = f"https://query1.finance.yahoo.com/v7/finance/options/{ticker}"
        urlDesc = f"https://query1.finance.yahoo.com/v11/finance/quoteSummary/{ticker}?modules=assetProfile"
        headers = {'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/50.0.2661.102 Safari/537.36'}
        response = requests.get(url, headers=headers)
        responseComp = requests.get(urlComp, headers=headers)
        responseDesc = requests.get(urlDesc, headers=headers)
        response.raise_for_status()
        responseComp.raise_for_status()
        responseDesc.raise_for_status()
    except requests.RequestException:
        return None

    # Parse responses
    try:
        quote = response.json()
        quoteComp = responseComp.json()
        quoteDesc = responseDesc.json()
        # initial 3 dicts preparation
        Comp = quoteComp["optionChain"]["result"][0]["quote"]
        Desc = quoteDesc["quoteSummary"]["result"][0]["assetProfile"]
        Fin = quote["quoteSummary"]["result"][0]["financialData"]

        return {  # .get method allows to check a dictionary for the key and sets a None value if the key doesn't exist. Thus one could avoid a KeyError
            "ticker": Comp.get("symbol"),
            "company": Comp.get("shortName"),
            "day": Comp.get("regularMarketChangePercent"),
            "desc": Desc.get("longBusinessSummary"),
            "price": Fin.get("currentPrice").get("raw"),
            "pe": Comp.get("trailingPE"),
            "fpe": Comp.get("forwardPE"),
            "pb": Comp.get("priceToBook"),
            "debt": Fin.get("debtToEquity").get("raw"),
            "roe": Fin.get("returnOnEquity").get("raw"),
            "profitMargins": Fin.get("profitMargins").get("raw"),
            "dividends": Comp.get("trailingAnnualDividendRate"),
            "targetPrice": Fin.get("targetMeanPrice").get("raw"),
            "recom": Comp.get("averageAnalystRating")
        }
    except (KeyError, TypeError, ValueError):
        return None


# ! look up a ticker for company name entered
def getTicker(company_name):
    yfinance = "https://query2.finance.yahoo.com/v1/finance/search"
    user_agent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36'
    params = {"q": company_name, "quotes_count": 1, "country": "United States"}
    res = requests.get(url=yfinance, params=params, headers={'User-Agent': user_agent})
    data = res.json()
    try:
        company_code = data['quotes'][0]['symbol']
    except:
        company_code = 'nothing'

    return company_code


# ! paper actualizer
def ActualizeMini():
    for paper in Stocks.objects.all():
        if paper.ticker != 'DIV':
            actual = checkStock(paper.ticker)
            paper.price = actual['price']
            paper.desc = actual['desc']
            paper.company = actual['company']
            paper.day = actual['day']
            paper.pe = actual['pe']
            paper.fpe = actual['fpe']
            paper.pb = actual['pb']
            paper.profitMargins = actual['profitMargins']
            paper.roe = actual['roe']
            paper.debt = actual['debt']
            paper.divs = actual['dividends']
            paper.targetPrice = actual['targetPrice']
            paper.recom = actual['recom']
            paper.save()
    print('actualized at ', datetime.datetime.now())
    return HttpResponse(status=204)

# ! this module runs in background and periodically summons Actualize function
scheduler = BackgroundScheduler({'apscheduler.job_defaults.max_instances': 4})
scheduler.add_job(ActualizeMini, 'interval', seconds=120)
scheduler.start()

# ? ------------------- login & co ------------------------

def login_view(request):
    if request.method == "POST":

        # * Attempt to sign user in
        username = request.POST["username"].lower()
        password = request.POST["password"]
        user = authenticate(request, username=username, password=password)

        # * Check if authentication is successful
        if user is not None:
            login(request, user)
            return index(request, "You are logged in")
        else:
            return render(request, "stocks/login.html", {
                "message": "Invalid username and/or password."
            })
    else:
        return render(request, "stocks/login.html")


def logout_view(request):
    logout(request)
    return index(request, "Logged out")


def register(request):
    if request.method == "POST":
        username = request.POST["username"].lower()
        email = request.POST["email"]

        # * Ensure password matches confirmation
        password = request.POST["password"]
        confirmation = request.POST["confirmation"]
        if password != confirmation:
            return render(request, "stocks/register.html", {
                "message": "Passwords must match."
            })

        # * Attempt to create new user
        try:
            user = User.objects.create_user(username, email, password)
            user.save()
        except IntegrityError:
            return render(request, "stocks/register.html", {
                "message": "User already exists."
            })
        login(request, user)
        return index(request, "You are registered")
    else:
        return render(request, "stocks/register.html")
