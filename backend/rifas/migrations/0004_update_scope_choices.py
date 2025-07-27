# Generated manually to update scope choices

from django.db import migrations, models


def update_scope_values(apps, schema_editor):
    """Update existing scope values to match new choices"""
    Raffle = apps.get_model('rifas', 'Raffle')
    
    # Update scope values
    Raffle.objects.filter(scope='state').update(scope='provincial')
    Raffle.objects.filter(scope='local').update(scope='provincial')


def reverse_scope_values(apps, schema_editor):
    """Reverse the scope value changes"""
    Raffle = apps.get_model('rifas', 'Raffle')
    
    # Reverse scope values
    Raffle.objects.filter(scope='provincial').update(scope='state')


class Migration(migrations.Migration):
    
    dependencies = [
        ('rifas', '0003_raffle_scope_location_raffle_allowed_locations'),
    ]

    operations = [
        migrations.RunPython(
            update_scope_values,
            reverse_scope_values,
        ),
        # Update the model field choices
        migrations.AlterField(
            model_name='raffle',
            name='scope',
            field=models.CharField(
                choices=[
                    ('provincial', 'Provincial'),
                    ('national', 'National'),
                    ('international', 'International'),
                ],
                default='provincial',
                max_length=20
            ),
        ),
    ]