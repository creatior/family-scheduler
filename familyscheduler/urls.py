from django.contrib import admin
from django.urls import path
from famschapp.views import *

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/user/', current_user, name='current_user'),
    path('api/register/', RegisterAPI.as_view(), name='register'),
    path('api/login/', LoginAPI.as_view(), name='login'),
    path('api/events/', EventAPI.as_view(), name='events'),
    path('api/events/<int:pk>/', EventDetailAPI.as_view(), name='event-detail'),
    path('api/events/week/', WeekEventsAPI.as_view(), name='week-events'),
    path('api/family/members/', FamilyMembersView.as_view(), name='family-members'),
]