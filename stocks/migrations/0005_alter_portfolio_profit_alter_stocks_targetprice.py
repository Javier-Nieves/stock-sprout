# Generated by Django 4.0.6 on 2022-11-30 21:57

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('stocks', '0004_alter_myprice_myprice_alter_stocks_price'),
    ]

    operations = [
        migrations.AlterField(
            model_name='portfolio',
            name='profit',
            field=models.FloatField(default=0),
        ),
        migrations.AlterField(
            model_name='stocks',
            name='targetPrice',
            field=models.FloatField(blank=True),
        ),
    ]
