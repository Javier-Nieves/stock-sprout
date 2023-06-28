
from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("action", views.indexPost, name="indexPost"),
    path("dividends", views.histPost, name="histPost"),
    path("login", views.login_view, name="login"),
    path("logout", views.logout_view, name="logout"),
    path("register", views.register, name="register"),
    path('history', views.blank_page, name='history page refresh'),
    path("company/<str:name>", views.blank_page, name='companypage refresh'),

    # API Routes
    path("companies/<str:name>", views.company_view, name="company"),
    path("history/dividend", views.histPost, name="dividends"),
    path("change/<int:ident>/<str:newText>",
         views.histChange, name="div-title"),
    path('authCheck', views.auth_check, name='logged in'),

    # OAuth 2
    path('social/authorize/', views.social_authorize, name='social-authorize'),
    path('callback/', views.social_callback, name='social-callback'),

    path('fast/', views.fast_account, name='fast-account'),

]
