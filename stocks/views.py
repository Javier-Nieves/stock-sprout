import requests
import datetime
import random
from apscheduler.schedulers.background import BackgroundScheduler

from django.shortcuts import render
from django.contrib.auth import authenticate, login, logout
from django.views.decorators.http import require_POST
from django.db import IntegrityError
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse
from django.urls import reverse

from .forms import TickerForm, BuyForm
from .models import User, Stocks, MyPrice, Portfolio, History


def index(request, message=""):  # with default value of message
    form = TickerForm()
    buy_form = BuyForm()

    # ? does user have a portfolio?
    if request.user.is_authenticated:
        try:
            mine = Portfolio.objects.get(owner=request.user)
        except:
            Portfolio.objects.create(owner=request.user)
            mine = Portfolio.objects.get(owner=request.user)

        prices = MyPrice.objects.filter(investor=request.user)
        history = History.objects.filter(user=request.user)
        return render(request, 'stocks/index.html', {
            'form': form,
            'buyForm': buy_form,
            'port': mine.stock.all(),
            'prices': prices,
            'history': history,
            'profit': mine.profit,
            'message': message
            })
    else:
        return render(request, 'stocks/index.html', {
            'form': form,
            'message': message,
            'history': "history"
            })


@require_POST
def indexPost(request):
    ticker_form = TickerForm(request.POST)
    buy_form = BuyForm(request.POST)
    if request.user.is_authenticated:
        mine = Portfolio.objects.get(owner=request.user)
        prices = MyPrice.objects.filter(investor=request.user)
        history = History.objects.filter(user=request.user)

    # ! if ticker is being searched
    # check whether form is valid:
    if ticker_form.is_valid():
        # process the data in form.cleaned_data as required
        # geting ticker name
        ticker = ticker_form.cleaned_data['stock_ticker']
        # check - all info about that ticker
        check = checkStock(ticker)
        buy_form = BuyForm()
        if request.user.is_authenticated:
            return render(request, 'stocks/index.html', {
            'form': ticker_form,
            'buyForm': buy_form,
            'check': check,
            'port': mine.stock.all(),
            'prices': prices,
            'history': history,
            'profit': mine.profit
            })
        else: 
            return render(request, 'stocks/index.html', {
            'form': ticker_form,
            'buyForm': buy_form,
            'check': check
            })

    # ! BUY
    name = request.POST.get('hidden-ticker').upper()
    # if stock is being added to the portfolio
    if buy_form.is_valid():
        port = Portfolio.objects.get(owner=request.user)
        amount = buy_form.cleaned_data['buy_ticker']
        form_price = buy_form.cleaned_data['buy_price']
        # ! stock is being bought
        if 'buy_btn' in request.POST:
            # if the stock doesn't exist in the DB
            try: 
                Stocks.objects.get(ticker=name)
            except:
                # get API data for the ticker
                check = checkStock(name)
                print(name)
                # ? create Stock db entry
                Stocks.objects.create(ticker=name, company=check['company'], day=check['day'], desc=check['desc'], price=check['price'], 
                pe=check['pe'], fpe=check['fpe'], pb=check['pb'], debt=check['debt'],roe=check['roe'], profitMargins=check['profitMargins'], 
                divs=check['dividends'], targetPrice=check['targetPrice'], recom=check['recom'])

            # does User already have this stock?
            stock = Stocks.objects.get(ticker=name)

            if not stock in port.stock.all():
                port.stock.add(stock)

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
            if Stocks.objects.filter(ticker=name).exists():
                
                # Does user have this stock?
                stock = Stocks.objects.get(ticker=name)
                if not stock in mine.stock.all():
                    return index(request, "You don't have this stock")
                
                # Does user have enough of this stock to sell
                MP = MyPrice.objects.get(investor=request.user, stock=stock)
                if amount > MP.quant:
                    return index(request, "You don't have enough lots")

                else:
                    MP.quant -= amount
                    port.profit += amount * form_price - amount * MP.myPrice
                    port.save()
                    MP.save()
                    # delete stock from portfolio if everything is sold
                    if MP.quant == 0:
                        port.stock.remove(stock)
                        MP.delete()

                     # * History update on sell
                    History.objects.create(user=request.user, stock=stock, ammount=amount, SPrice=form_price, MyPriceHist=MP.myPrice, action="Sell")

                    return index(request, 'sell')

            else:
                return index(request, "You don't have this stock")
        else:
            return HttpResponse("<h1>How did you get here?</h1>")


def company_view (request, name):
    # if Company View is summoned via top link - open random company from DB
    if name == 'random':
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
    port = Portfolio.objects.get(owner=request.user)
    # ?Django form was used previously, but form submittions reloads the page, so JS is used instead
    # div_form = DividendForm(request.POST)
    # if div_form.is_valid():
    #     title = div_form.cleaned_data['title']
    #     dividend = div_form.cleaned_data['dividend']
    stk = Stocks.objects.get(ticker="DIV")
    # ? create new dividend entry in DB
    History.objects.create(user=request.user, stock=stk, action="Div", SPrice=dividend, note=title)
    port.profit += dividend
    port.save()

    return index(request, 'Dividends received')


# ! ------------------ functions ---------------

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
        #print(quote)
        quoteComp = responseComp.json()
        quoteDesc = responseDesc.json()
        # initial 3 dists preparation
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
        username = request.POST["username"]
        password = request.POST["password"]
        user = authenticate(request, username=username, password=password)

        # * Check if authentication is successful
        if user is not None:
            login(request, user)
            return HttpResponseRedirect(reverse("index"))
        else:
            return render(request, "stocks/login.html", {
                "message": "Invalid username and/or password."
            })
    else:
        return render(request, "stocks/login.html")


def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse("index"))


def register(request):
    if request.method == "POST":
        username = request.POST["username"]
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
                "message": "Username already taken."
            })
        login(request, user)
        return HttpResponseRedirect(reverse("index"))
    else:
        return render(request, "stocks/register.html")
