from django.conf.urls import patterns, url, include
from django.contrib import admin

admin.autodiscover()

urlpatterns = patterns(
    '',
    url(r'^admin/', include(admin.site.urls)))

urlpatterns += patterns(
    url(r'^validation/', include('validation_extended.urls')))

urlpatterns += patterns(
    'core.views',
    url(r'^struct/?$', 'show_struct'),
    url(r'^get_model_data/?$', 'get_model_data'),
    url(r'^add_data/?$', 'add_data'),
    url(r'^update_data/?$', 'update_data'),
    url(r'^delete_data/?$', 'delete_data'),
    url(r'^$', 'index'))
