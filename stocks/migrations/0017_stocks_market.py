# Generated by Django 4.2.1 on 2023-07-17 17:35

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('stocks', '0016_user_social_id'),
    ]

    operations = [
        migrations.AddField(
            model_name='stocks',
            name='market',
            field=models.CharField(blank=True, max_length=30, null=True),
        ),
    ]
