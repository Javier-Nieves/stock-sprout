
from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("action", views.indexPost, name="indexPost"),
    path("dividends", views.histPost, name="histPost"),
    path("login", views.login_view, name="login"),
    path("logout", views.logout_view, name="logout"),
    path("register", views.register, name="register"),

    # API Route
    path("companies/<str:name>", views.company_view, name="company"),
    path("history/<str:title>/<int:dividend>", views.histPost, name="dividends"),
    path("change/<int:ident>/<str:newText>", views.histChange, name="div-title")

]
