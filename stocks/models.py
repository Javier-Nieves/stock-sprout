from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    pass

class Stocks(models.Model):
    ticker = models.CharField(max_length = 10)
    company = models.CharField(max_length = 50)
    day = models.FloatField(null=True)
    desc = models.CharField(max_length = 700, default="None", null=True)
    price = models.FloatField(null=True)
    pe = models.FloatField(null=True)
    fpe = models.FloatField(null=True)
    pb = models.FloatField(null=True)
    debt = models.FloatField(null=True)
    roe = models.FloatField(null=True)
    profitMargins = models.FloatField(null=True)
    divs = models.IntegerField(null=True)
    targetPrice = models.FloatField(null=True)
    recom = models.CharField(max_length = 30, null=True)

    def serialize(self):  # object.serialize() now will return a JSON object
        return {
            "ticker": self.ticker,
            "company": self.company,
            "day": self.day,
            "desc": self.desc,
            "price": self.price,
            "pe": self.pe,
            "fpe": self.fpe,
            "pb": self.pb,
            "profitMargins": self.profitMargins,
            "roe": self.roe,
            "debt": self.debt,
            "dividends": self.divs,
            "targetPrice": self.targetPrice,
            "recom": self.recom
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
    

