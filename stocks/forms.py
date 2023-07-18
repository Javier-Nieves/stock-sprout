from django import forms


# class SearchForm(forms.Form):
#     stock_ticker = forms.CharField(label='', max_length=10, widget=forms.TextInput(
#         attrs={'class': "ticker-inp",
#                'placeholder': "Company"}))


class BuyForm(forms.Form):
    buy_price = forms.FloatField(label='', widget=forms.TextInput(
        attrs={'class': "ticker-buy",
               'placeholder': "Price",
               'type': 'number',
               'min': '0.000001',
               'step': '0.000001'
               }))
    buy_amount = forms.IntegerField(label='', widget=forms.TextInput(
        attrs={'class': "ticker-buy",
               'placeholder': "Amount",
               'type': 'number',
               'min': '1'
               }))

# class DividendForm(forms.Form):
#     title = forms.CharField(label='', max_length=20, widget=forms.TextInput(
#                             attrs={'class': "ticker-inp long",
#                             'placeholder': "Title"
#                             }))
#     dividend = forms.FloatField(label='', widget=forms.TextInput(
#                               attrs={'class': "ticker-buy",
#                               'placeholder': "$",
#                               'type': 'number',
#                               'min': '0.01',
#                               'step': '0.01'
#                               }))
