# Generated by Django 4.2.1 on 2023-07-18 22:21

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('stocks', '0018_rename_debt_stocks_avpr200_alter_stocks_desc'),
    ]

    operations = [
        migrations.AddField(
            model_name='stocks',
            name='eps',
            field=models.FloatField(blank=True, null=True),
        ),
    ]
