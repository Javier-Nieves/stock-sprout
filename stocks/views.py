import os
import requests
from requests_oauthlib import OAuth2Session
from datetime import datetime, timedelta
from faker import Faker
import random
import json
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger

from django.shortcuts import redirect, render
from django.contrib.auth import authenticate, login, logout
from django.views.decorators.http import require_POST
from django.db import IntegrityError
from django.http import HttpResponse, JsonResponse
from django.views.decorators.csrf import csrf_exempt

from .forms import SearchForm, BuyForm
from .models import User, Stocks, MyPrice, Portfolio, History


def index(request, message=""):
    search_form = SearchForm()
    buy_form = BuyForm()

    # ? does user have a portfolio?
    if request.user.is_authenticated:
        user = request.user
        try:
            portfolio = Portfolio.objects.get(owner=user)
        except:
            Portfolio.objects.create(owner=user)
            portfolio = Portfolio.objects.get(owner=user)
    else:
        user = User.objects.get(username='tester')
        portfolio = Portfolio.objects.get(owner=user)

    prices = MyPrice.objects.filter(investor=user)
    history = History.objects.filter(user=user).order_by('id')
    return render(request, 'stocks/index.html', {
        'search_form': search_form,
        'buyForm': buy_form,
        'portfolio': portfolio.stock.all(),
        'prices': prices,
        'history': history,
        'profit': portfolio.profit,
        'message': message
    })


@require_POST
def indexPost(request):
    search_form = SearchForm(request.POST)
    buy_form = BuyForm(request.POST)
    if request.user.is_authenticated:
        user = request.user
    else:
        user = User.objects.get(username='tester')
    portfolio = Portfolio.objects.get(owner=user)
    prices = MyPrice.objects.filter(investor=user)
    history = History.objects.filter(user=user)

    # ! if ticker is being searched
    # check whether form is valid:
    if search_form.is_valid():
        # process the data in form.cleaned_data as required
        ticker = search_form.cleaned_data['stock_ticker']
        # if user entered ticker:
        compData = checkStock(ticker)
        # if company name is entered - find it's ticker
        if compData == None:
            compData = checkStock(getTicker(ticker))
            if compData == None:
                return index(request, "Stock doesn't exist")

        buy_form = BuyForm()
        return render(request, 'stocks/index.html', {
            'search_form': search_form,
            'buyForm': buy_form,
            'compData': compData,
            'portfolio': portfolio.stock.all(),
            'prices': prices,
            'history': history,
            'profit': portfolio.profit
        })

    # ! BUY
    ticker = request.POST.get('hidden-ticker').upper()
    # if stock is being added to the portfolio
    if buy_form.is_valid():
        portfolio = Portfolio.objects.get(owner=request.user)
        amount = buy_form.cleaned_data['buy_amount']
        form_price = buy_form.cleaned_data['buy_price']
        if 'buy_btn' in request.POST:
            # if the stock doesn't exist in the DB
            try:
                Stocks.objects.get(ticker=ticker)
            except:
                # get API data for the ticker
                compData = checkStock(ticker)
                # ? create Stock db entry
                Stocks.objects.create(ticker=ticker, company=compData['company'], day=compData['day'], desc=compData['desc'], price=compData['price'],
                                      pe=compData['pe'], fpe=compData['fpe'], pb=compData['pb'], debt=compData[
                                          'debt'], roe=compData['roe'], profitMargins=compData['profitMargins'],
                                      divs=compData['dividends'], targetPrice=compData['targetPrice'], recom=compData['recom'])
            # does User already have this stock?
            stock = Stocks.objects.get(ticker=ticker)
            if not stock in portfolio.stock.all():
                portfolio.stock.add(stock)
                portfolio.save()

            # * MyPrice update
            if MyPrice.objects.filter(investor=request.user, stock=stock).exists():
                MP = MyPrice.objects.get(investor=request.user, stock=stock)
                MP.myPrice = (MP.myPrice * MP.quant + amount *
                              form_price) / (MP.quant + amount)
                MP.quant += amount
                MP.save()
            else:
                MyPrice.objects.create(
                    investor=request.user, stock=stock, quant=amount, myPrice=form_price)

            # * History update on buy
            MP = MyPrice.objects.get(investor=request.user, stock=stock)
            History.objects.create(user=request.user, stock=stock, ammount=amount,
                                   MyPriceHist=MP.myPrice, BPrice=form_price, action="Buy")

            return index(request, 'Stock bought')

        # ! SELL
        elif 'sell_btn' in request.POST:

            # is there such stock in the db?
            if Stocks.objects.filter(ticker=ticker).exists():

                # Does user have this stock?
                stock = Stocks.objects.get(ticker=ticker)
                if not stock in portfolio.stock.all():
                    return index(request, "You don't have this stock :(")

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
                    History.objects.create(user=request.user, stock=stock, ammount=amount,
                                           SPrice=form_price, MyPriceHist=MP.myPrice, action="Sell")

                    return index(request, 'Stock sold')

            else:
                return index(request, "You don't have this stock")
        else:
            return HttpResponse("<h1>How did you get here?</h1>")


def company_view(request, name):
    if checkStock(name) == None and name != "random":
        name = getTicker(name)
        if checkStock(name) == None:
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


@csrf_exempt
def histPost(request):
    portfolio = Portfolio.objects.get(owner=request.user)
    try:
        Stocks.objects.get(ticker="DIV")
    except:
        Stocks.objects.create(ticker='DIV', company='dividends')
    stock = Stocks.objects.get(ticker="DIV")

    if request.method == "PUT":
        data = json.loads(request.body)
        title = data["title"]
        dividend = data["amount"]

    # ? create new dividend entry in DB
    newEntry = History.objects.create(user=request.user, action="Div", stock=stock,
                                      SPrice=dividend, BPrice=0, MyPriceHist=0, ammount=0, note=title)
    portfolio.profit += float(dividend)
    portfolio.save()
    return JsonResponse({'status': 'false',
                         'id': newEntry.id})


def histChange(request, ident, newText):
    # ? change the dividend entry in DB
    changing = History.objects.get(id=ident)
    changing.note = newText
    changing.save()
    return JsonResponse({'status': 'false'}, status=204)


def blank_page(request, name=''):
    return index(request)


def auth_check(request):
    return JsonResponse({'LoggedIn': request.user.is_authenticated})

# ! ------------------ functions ---------------


# ! get company financial data by ticker (API function)
def checkStock(ticker):
    # we try international stocks first
    try:
        url = f"https://query1.finance.yahoo.com/v11/finance/quoteSummary/{ticker}?modules=financialData"
        urlComp = f"https://query1.finance.yahoo.com/v7/finance/options/{ticker}"
        urlDesc = f"https://query1.finance.yahoo.com/v11/finance/quoteSummary/{ticker}?modules=assetProfile"
        headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/50.0.2661.102 Safari/537.36'}
        response = requests.get(url, headers=headers)
        responseComp = requests.get(urlComp, headers=headers)
        responseDesc = requests.get(urlDesc, headers=headers)
        response.raise_for_status()
        responseComp.raise_for_status()
        responseDesc.raise_for_status()
    except requests.RequestException:
        # If unsuccessful - try for russian ticker
        return checkStockRus(ticker)

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


def checkStockRus(ticker):
    try:
        url = f"https://iss.moex.com/iss/engines/stock/markets/shares/securities/{ticker}.json"
        headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/50.0.2661.102 Safari/537.36'}
        response = requests.get(url, headers=headers)
        response.raise_for_status()
    except requests.RequestException:
        # this API always return some JSON. It just might be full of empty forms
        return None

    quote = response.json()
    if len(quote['marketdata']['data']) == 0:
        print('no price data for', ticker)
        return None

    i = 0
    while quote['marketdata']['data'][i][1] != 'TQBR':
        i += 1
    data = quote['marketdata']['data'][i]

    for item in data:
        if isinstance(item, (int, float)) and item != 0:
            price = item
            break
    if not price:
        print('all is none or 0')
        return None  # If no non-null numbers are found
    Desc = quote['securities']['data'][0]
    rate = GiveExchangeFor('rub')
    try:
        return {
            "ticker": data[0],
            "company": Desc[20],
            "day": None,
            "desc":  None,
            "price": price*rate,
            "pe":  None,
            "fpe":  None,
            "pb":   None,
            "debt":   None,
            "roe":   None,
            "profitMargins":  None,
            "dividends":  None,
            "targetPrice":  None,
            "recom":  None,
        }

    except KeyError as error:
        print(str(error))


def GiveExchangeFor(currency):
    # this API can do much more than this
    try:
        url = f'https://cdn.jsdelivr.net/gh/fawazahmed0/currency-api@1/latest/currencies/{currency}/usd.json'
        headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/50.0.2661.102 Safari/537.36'}
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        return response.json()['usd']
    except requests.RequestException:
        return None


# ! look up a ticker for company name entered
def getTicker(company_name):
    yfinance = "https://query2.finance.yahoo.com/v1/finance/search"
    user_agent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36'
    params = {"q": company_name, "quotes_count": 1, "country": "United States"}
    res = requests.get(url=yfinance, params=params,
                       headers={'User-Agent': user_agent})
    data = res.json()
    try:
        company_code = data['quotes'][0]['symbol']
    except:
        company_code = 'DIV'

    return company_code


# # ! paper actualizer
# def ActualizeMini():
#     for paper in Stocks.objects.all():
#         if paper.ticker != 'DIV':
#             actual = checkStock(paper.ticker)
#             if actual is not None:
#                 paper.price = actual.get('price')
#                 paper.desc = actual.get('desc')
#                 paper.company = actual.get('company')
#                 paper.day = actual.get('day')
#                 paper.pe = actual.get('pe')
#                 paper.fpe = actual.get('fpe')
#                 paper.pb = actual.get('pb')
#                 paper.profitMargins = actual.get('profitMargins')
#                 paper.roe = actual.get('roe')
#                 paper.debt = actual.get('debt')
#                 paper.divs = actual.get('dividends')
#                 paper.targetPrice = actual.get('targetPrice')
#                 paper.recom = actual.get('recom')
#                 paper.save()
#     print('actualized at ', datetime.now())
#     return HttpResponse(status=204)


# # ! this module runs in background and periodically summons Actualize function
# scheduler = BackgroundScheduler({'apscheduler.job_defaults.max_instances': 4})
# trigger = IntervalTrigger(minutes=2)
# scheduler.add_job(ActualizeMini, trigger)
# scheduler.start()

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
    if 'temp_id' in os.environ:
        delete_id = int(os.environ['temp_id'])
        User.objects.get(social_id=delete_id).delete()
        del os.environ['temp_id']
    logout(request)
    return index(request, "Logged out")


def register(request):
    if request.method == "POST":
        username = request.POST["username"].lower()
        # email = request.POST["email"].lower()

        # * Ensure password matches confirmation
        password = request.POST["password"]
        confirmation = request.POST["confirmation"]
        if password != confirmation:
            return render(request, "stocks/register.html", {
                "message": "Passwords must match."
            })

        # * Attempt to create new user
        try:
            user = User.objects.create_user(
                username=username, password=password)
            user.save()
        except IntegrityError:
            return render(request, "stocks/register.html", {
                "message": "User already exists"
            })
        login(request, user)
        return index(request, "You are registered")
    else:
        return render(request, "stocks/register.html")


# Social login:

def social_authorize(request):
    redirect_uri = 'https://stock-sprout.onrender.com/callback'
    if 'git_btn' in request.POST:
        os.environ['source'] = 'github'
        client_id = os.environ['client_id_github']
        authorization_base_url = 'https://github.com/login/oauth/authorize'
        oauth = OAuth2Session(client_id, redirect_uri=redirect_uri)
    elif 'google_btn' in request.POST:
        os.environ['source'] = 'google'
        client_id = os.environ['client_id_google']
        authorization_base_url = 'https://accounts.google.com/o/oauth2/auth'
        scope = ['profile']
        oauth = OAuth2Session(
            client_id, redirect_uri=redirect_uri, scope=scope)
    # elif 'facebook_btn' in request.POST:
    #     os.environ['source'] = 'facebook'
    #     client_id = os.environ['client_id_facebook']
    #     authorization_base_url = 'https://www.facebook.com/dialog/oauth'
    #     oauth = OAuth2Session(client_id, redirect_uri=redirect_uri)
    authorization_url, state = oauth.authorization_url(
        authorization_base_url)
    return redirect(authorization_url)


def social_callback(request):
    # todo - add check and error message
    if os.environ['source'] == 'google':
        source = 'google'
        client_id = os.environ['client_id_google']
        client_secret = os.environ['client_secret_google']
        token_url = 'https://accounts.google.com/o/oauth2/token'
        apiUrl = 'https://www.googleapis.com/oauth2/v1/userinfo'
    # elif os.environ['source'] == 'facebook':
    #     source = 'facebook'
    #     client_id = os.environ['client_id_facebook']
    #     client_secret = os.environ['client_secret_facebook']
    #     token_url = 'https://graph.facebook.com/v12.0/oauth/access_token'
    #     apiUrl = 'https://graph.facebook.com/v12.0/me'
    elif os.environ['source'] == 'github':
        source = 'github'
        client_id = os.environ['client_id_github']
        client_secret = os.environ['client_secret_github']
        token_url = 'https://github.com/login/oauth/access_token'
        apiUrl = 'https://api.github.com/user'

    redirect_uri = 'https://stock-sprout.onrender.com/callback'
    oauth = OAuth2Session(client_id, redirect_uri=redirect_uri)
    token = oauth.fetch_token(
        token_url,
        client_secret=client_secret,
        authorization_response=request.build_absolute_uri()
    )
    # Using the token to make authenticated request to API
    oauth_session = OAuth2Session(client_id, token=token)
    user_info = oauth_session.get(apiUrl).json()
    return loginSocialUser(request, source, user_info)


def loginSocialUser(request, source, user_info):
    # cut user id because it can be too long
    social_id = str(user_info['id'])[-8:]
    social_id = int(social_id)
    print(social_id)
    try:
        User.objects.get(social_id=social_id)
    except:
        password = User.objects.make_random_password()
        if source == 'github':
            User.objects.create(
                social_id=social_id, username=user_info['login'],
                first_name=user_info['name'], password=password)
        elif source == 'google':
            User.objects.create(
                social_id=social_id, username=user_info['name'],
                first_name=user_info['given_name'], last_name=user_info['family_name'],
                password=password)
        # elif source == 'facebook':
        #     User.objects.create(
        #         social_id=social_id, username=user_info['name'],
        #         password=password)
    user = User.objects.get(social_id=social_id)
    if user is not None:
        login(request, user)
        return index(request, "You are logged in")
    else:
        return render(request, "stocks/login.html", {
            "message": "Invalid username/password"
        })


def fast_account(request):  # 20 minute account creation
    faker = Faker(['en', 'es', 'vi', 'sk'])
    name = faker.name()
    password = User.objects.make_random_password()
    random_id = faker.random_number(digits=6)
    user = User.objects.create(
        social_id=random_id, username=name, password=password)
    os.environ['temp_id'] = str(random_id)
    login(request, user)

    return index(request, "You have 20 minutes!")
