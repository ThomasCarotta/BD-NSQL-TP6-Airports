from django.urls import path
from . import views

urlpatterns = [
    path("airports", views.create_airport),              # POST
    path("airports", views.list_airports),               # GET all
    path("airports/popular", views.get_popular_airports),
    path("airports/nearby", views.get_nearby_airports),
    path("airports/<str:iata>", views.get_airport),      # GET one
    path("airports/<str:iata>", views.update_airport),   # PUT
    path("airports/<str:iata>", views.delete_airport),   # DELETE
]
