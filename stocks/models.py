from django.db import models
from django.contrib.auth.models import AbstractUser
from datetime import date


class User(AbstractUser):
    pass
    social_id = models.IntegerField(null=True, blank=True)


class Stocks(models.Model):
    ticker = models.CharField(max_length=10)
    company = models.CharField(max_length=50)
    day = models.FloatField(null=True, blank=True)
    desc = models.TextField(max_length=1500, default="None", null=True)
    price = models.FloatField(null=True, blank=True)
    market = models.CharField(max_length=30, null=True, blank=True)
    # pe = models.FloatField(null=True, blank=True)
    # fpe = models.FloatField(null=True, blank=True)
    # pb = models.FloatField(null=True, blank=True)
    # eps = models.FloatField(null=True, blank=True)
    # avPr200 = models.FloatField(null=True, blank=True)
    # roe = models.FloatField(null=True, blank=True)
    # profitMargins = models.FloatField(null=True, blank=True)
    # divs = models.FloatField(null=True, blank=True)
    # debt = models.FloatField(null=True, blank=True)
    # targetPrice = models.FloatField(null=True, blank=True)
    # recom = models.CharField(max_length=30, null=True, blank=True)
    # updateTime = models.DateField(
    #     default=date(2023, 7, 18), null=True, blank=True)

    def serialize(self):  # object.serialize() returns a JSON object
        return {
            "symbol": self.ticker,
            "name": self.company,
            "changesPercentage": self.day,
            "desc": self.desc,
            "price": self.price,
            'market': self.market,
            # "pe": self.pe,
            # "eps": self.eps,
            # 'priceAvg200': self.avPr200,
            # "fpe": self.fpe,
            # "PB": self.pb,
            # "profitMargins": self.profitMargins,
            # "ROE": self.roe,
            # "debt": self.debt,
            # "dividends": self.divs,
            # 'updateTime': self.updateTime
            # "targetPrice": self.targetPrice,
            # "recom": self.recom
        }

    def __str__(self):
        return f"{self.company}"


class MyPrice(models.Model):
    investor = models.ForeignKey(User, on_delete=models.CASCADE)
    stock = models.ForeignKey(Stocks, on_delete=models.CASCADE)
    myPrice = models.FloatField(blank=True)
    quant = models.IntegerField(blank=True)

    def __str__(self):
        return f"{self.investor} on {self.stock}"


class Portfolio(models.Model):
    owner = models.ForeignKey(User, on_delete=models.CASCADE)
    stock = models.ManyToManyField(Stocks, blank=True)
    profit = models.FloatField(default=0)

    def __str__(self):
        return f"{self.owner} portfolio"


class History(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    stock = models.ForeignKey(Stocks, on_delete=models.CASCADE, blank=True)
    BPrice = models.FloatField(default=0)
    MyPriceHist = models.FloatField(default=0)
    SPrice = models.FloatField(default=0)
    ammount = models.IntegerField(default=0)
    action = models.CharField(max_length=10, default="none")
    note = models.CharField(max_length=100, default="none")

    def __str__(self):
        return f"{self.user} {self.action} {self.stock}"
