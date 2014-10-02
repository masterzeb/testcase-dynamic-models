# -*- coding: utf-8 -*-
from validation_extended import Validator


class RangeValidator(Validator):
    client_events = ('keyup', )

    def __init__(self, min_value, max_value, msg=None):
        self.min_value = min_value
        self.max_value = max_value
        self.message = msg or (u'Должно быть в диапазоне %d-%d' % (min_value, max_value))
        super(RangeValidator, self).__init__(min_value, max_value, msg)

    def js_rules(self):
        return {'rule': 'range', 'params': [self.min_value, self.max_value]}

    def validate(self, field_name, field_data):
        if not (self.min_value <= field_data <= self.max_value):
            self.raise_error()
