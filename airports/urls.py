# from django.urls import path
# from . import views

# urlpatterns = [
#     path('airports', views.list_airports),
#     path('airports/<str:iata>', views.get_airport),
#     path('airports/<str:iata>', views.update_airport),
#     path('airports/<str:iata>', views.delete_airport),
#     path('airports/nearby/', views.get_nearby_airports),
#     path('airports/popular', views.get_popular_airports),
#     path('airports/', views.create_airport),  # Para POST
# ]

from django.urls import path
from . import views

urlpatterns = [
    path("airports", views.handle_airports),
    path("airports/", views.handle_airports),  # Para POST (compatibilidad)
    path("airports/<str:iata>", views.handle_airport_by_iata),
    path("airports/nearby", views.get_nearby_airports),
    path("airports/popular", views.get_popular_airports),
]

