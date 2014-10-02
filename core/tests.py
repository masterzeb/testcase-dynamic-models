from urllib import urlencode

from django.http import QueryDict
from django.test import TestCase
from .models import manager


class Test(TestCase):
    fixtures = ['test_data']

    def test_create_ticket_record(self):
        obj = manager.models['Ticket'](
            title='test', created='2013-04-09', deadline='2013-04-15', rating=50)
        obj.save()
        self.assertIsNotNone(obj.id)

    def test_tickets_ordering(self):
        obj = manager.models['Ticket'].objects.all()[0]
        obj2 = manager.models['Ticket'].objects.order_by('-rating').all()[0]
        self.assertEqual(obj, obj2)

    def test_ticket_update(self):
        obj = manager.models['Ticket'].objects.get(pk=2)
        obj.title = u'test'
        obj.save()

        title = manager.models['Ticket'].objects.get(pk=2).title
        self.assertEqual(title, u'test')

    def test_ticket_delete(self):
        Ticket = manager.models['Ticket']
        Ticket.objects.filter(rating__lt=80).delete()
        self.assertEqual(Ticket.objects.count(), Ticket.objects.filter(rating__gte=80).count())

    def test_client_form(self):
        data = {'name': u'John', 'surname': u'Smith', 'birthdate': u'2000-05-04'}
        form = manager.forms['Client'](QueryDict(urlencode(data)))
        if form.is_valid():
            obj = form.save()
            self.assertIsNotNone(obj.id)
        else:
            self.fail()
