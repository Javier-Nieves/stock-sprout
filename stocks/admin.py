from django.contrib import admin

from .models import User, Stocks, Portfolio, MyPrice, History

admin.site.register(User)
admin.site.register(Stocks)
admin.site.register(Portfolio)
admin.site.register(MyPrice)
admin.site.register(History)
