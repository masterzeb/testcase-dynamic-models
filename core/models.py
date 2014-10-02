import importlib
import os
import json

from django.conf import settings
from django.db.models import Model, CharField, DateField, IntegerField
from django.forms import ModelForm
from django.contrib.admin import ModelAdmin, site
from django.utils.text import capfirst
from validation_extended import AutoValidated, ClientValidated


class DynamicallyModelManager(object):
    def __init__(self):
        ''' Singletone pattern. Models and forms are stored in manager instance '''
        self.models_json_struct = {}
        self.models = {}
        self.forms = {}
        self.files = []

        for path in settings.STRUCTURE_DIRS:
            for file_name in os.listdir(path):
                self.files.append(os.path.join(path, file_name))
                with open(self.files[-1]) as f:
                    self.models_json_struct.update({
                        name.lower(): struct for name, struct in json.load(f).items()})

        for model_name in self.models_json_struct.keys():
            model = self.make_model(model_name)
            form = self.make_form(model_name, model)

            self.make_admin_class(model_name, model, form)
            self.models[capfirst(model_name)] = model
            self.forms[capfirst(model_name)] = form

    @staticmethod
    def get_field_type(type_):
        ''' Returns django field class by mnemonics '''

        types = {'char': CharField, 'date': DateField, 'int': IntegerField}
        return types.get(type_)

    @staticmethod
    def get_validator(validator_path, args):
        module = importlib.import_module('.'.join(validator_path.split('.')[:-1]))
        validator_class = getattr(module, validator_path.split('.')[-1])
        return validator_class(*args) if args else validator_class

    def get_model_module(self, model_name):
        ''' Returns model module '''

        module_name = '%s.models' % self.models_json_struct[model_name].get('app', __package__)
        return {'__module__': module_name}

    def get_model_fields(self, model_name):
        ''' Returns django field instances as dict where fields ids are keys '''

        fields = self.models_json_struct[model_name]['fields']
        return {f['id']: self.get_field_type(f['type'])(**f['opts']) for f in fields}

    def get_model_meta_subclass(self, model_name):
        ''' Returns model Meta subclass if defined in struct '''

        model_struct = self.models_json_struct[model_name]
        if 'meta' in model_struct:
            return {'Meta': self.make_inner_class('Meta', model_struct['meta'])}
        return {}

    def get_unicode_function(self, model_name):
        ''' Returns __unicode__ method for model if defined in struct '''

        unicode_ = self.models_json_struct[model_name].get('unicode', {})
        if unicode_:
            def __unicode__(self):
                args = [getattr(self, x) for x in unicode_.get('format', [])]
                return unicode_['pattern'].format(*args)
            return {'__unicode__': __unicode__}
        return {}

    def get_form_validators(self, model_name, group_name='self'):
        result = {}
        model_struct = self.models_json_struct[model_name]
        for field in model_struct.get('fields', []):
            validators = []
            for validator_path, args in field.get('validators', {}).get(group_name, {}).items():
                validators.append(self.get_validator(validator_path, args))
            result[field['id']] = validators
        return result

    @staticmethod
    def make_inner_class(class_name, data_dict):
        return type(class_name, (object, ), data_dict)

    def make_model(self, model_name):
        ''' Creates django model '''

        model_dict = self.get_model_module(model_name)
        model_dict.update(self.get_model_fields(model_name))
        model_dict.update(self.get_model_meta_subclass(model_name))
        model_dict.update(self.get_unicode_function(model_name))
        return type(str(capfirst(model_name)), (Model, ), model_dict)

    def make_form(self, model_name, model):
        ''' Creates django model form '''

        base_classes = (AutoValidated, ClientValidated, ModelForm)
        form_dict = {'Meta': self.make_inner_class('Meta', {'model': model})}

        validators = self.get_form_validators(model_name)
        validators_requires_all = self.get_form_validators(model_name, 'all')

        if validators or validators_requires_all:
            if validators_requires_all:
                validators['RequiresAll'] = self.make_inner_class(
                    'RequiresAll', validators_requires_all)
            form_dict['Validators'] = self.make_inner_class('Validators', validators)
        result = type(str('%sModelForm' % capfirst(model_name)), base_classes, form_dict)
        return result

    def make_admin_class(self, model_name, model, form=None):
        ''' Creates and register django admin class '''

        admin_dict = {'form': form}
        if 'admin' in self.models_json_struct[model_name]:
            admin_dict.update(self.models_json_struct[model_name]['admin'])
        model_admin = type(str('%sAdmin' % capfirst(model_name)), (ModelAdmin, ), admin_dict)
        site.register(model, model_admin)


manager = DynamicallyModelManager()
