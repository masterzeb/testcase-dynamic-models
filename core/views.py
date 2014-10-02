import json

from annoying.decorators import ajax_request, render_to
from django.conf import settings
from django.shortcuts import HttpResponse

from .models import manager
from .helpers import format_attr


def show_struct(request):
    result = {}
    indent = int(request.GET.get('indent', 3))

    for file_ in manager.files:
        with open(file_) as f:
            result.update(json.load(f))
    data = json.dumps(result, indent=indent, ensure_ascii=False)
    return HttpResponse(content=data, mimetype='application/json; charset="utf-8"')


@render_to('index.html')
def index(request):
    return {'models': [(model.__name__, model._meta) for model in manager.models.values()]}


@ajax_request
def get_model_data(request):
    model_name = request.POST['model_name']
    struct = []
    data = []

    model_struct = manager.models_json_struct[model_name.lower()]
    for field in model_struct['fields']:
        if field.get('opts', {}).get('editable', True):
            struct.append({
                'id': field['id'],
                'type': field['type'],
                'verbose_name': field.get('opts', {}).get('verbose_name', '')})
            if field['type'] == 'date':
                struct[-1]['format'] = field.get(
                    'format', getattr(settings, 'DEFAULT_DATE_FORMAT', None))

    # may be better to use serializers, but it is hard to change date format
    for obj in manager.models[model_name].objects.all():
        obj_dict = {'id': obj.id}
        for field in struct:
            attr = getattr(obj, field['id'])
            obj_dict[field['id']] = format_attr(attr, field.get('format', None))
        data.append(obj_dict)

    validation_rules = manager.forms[model_name]().make_rules()
    return {'struct': struct, 'data': data, 'validation_rules': validation_rules}


@ajax_request
def add_data(request):
    data = request.POST.copy()
    model_name = data.pop('model_name')[0]
    form = manager.forms[model_name](data)
    if form.is_valid():
        obj = form.save()
        return {'success': True, 'id': obj.id}
    return {'success': False}


@ajax_request
def delete_data(request):
    model_name = request.POST.get('model_name')
    pks = [int(pk) for pk in request.POST.getlist('pks[]')]
    try:
        manager.models[model_name].objects.filter(pk__in=pks).delete()
    except Exception:
        return {'success': False}
    return {'success': True}


@ajax_request
def update_data(request):
    data = request.POST.copy()
    result = {'success': True, 'pk': data.pop('pk')[0]}

    for key in [k for k in data.keys() if k.startswith('_')]:
        result[key] = data.pop(key)[0]

    model_name = data.pop('model_name')[0]
    model = manager.models[model_name]
    instance = model.objects.get(pk=result['pk'])
    form = manager.forms[model_name](data, instance=instance)

    if not form.is_valid():
        for field_name in data.keys():
            if field_name in form.errors:
                result['success'] = False
            else:
                setattr(instance, field_name, form.cleaned_data[field_name])
                instance.save()
    else:
        form.save()
    return result
