# views.py

from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

import json
import pymongo
import redis

# Conexiones
mongo_client = pymongo.MongoClient(
    "mongodb://admin:admin123@aeropuerto-mongo:27017/",
    authSource="admin"
)
db = mongo_client["airport_db"]
collection = db["airports"]

redis_client = redis.Redis(
    host="aeropuerto-redis",
    port=6379,
    decode_responses=True
)
POPULARITY_KEY = "airport_popularity"
# Aseguramos que el ZSET de popularidad tenga TTL de 1 día
redis_client.expire(POPULARITY_KEY, 86400)


@csrf_exempt
@require_http_methods(["GET", "POST"])
def handle_airports(request):
    if request.method == "GET":
        airports = list(collection.find({}, {"_id": 0}))
        return JsonResponse(airports, safe=False)

    elif request.method == "POST":
        data = json.loads(request.body)
        collection.insert_one(data)

        # Añadimos a Redis GEO
        key = data.get("iata_faa") or data.get("icao")
        lat = data.get("lat")
        lng = data.get("lng")
        if key and lat and lng:
            redis_client.geoadd("airports", (lng, lat, key))
            print("✅ Añadido a Redis GEO:", key, lat, lng)

        return JsonResponse({"message": "Airport created"}, status=201)


@csrf_exempt
@require_http_methods(["GET", "PUT", "DELETE"])
def handle_airport_by_iata(request, iata):
    # Filtro que acepta tanto iata_faa como icao
    filter_query = {"$or": [{"iata_faa": iata}, {"icao": iata}]}

    if request.method == "GET":
        airport = collection.find_one(filter_query, {"_id": 0})
        if airport:
            # Incrementar popularidad
            redis_client.zincrby(POPULARITY_KEY, 1, iata)
            redis_client.expire(POPULARITY_KEY, 86400)
            return JsonResponse(airport)
        return JsonResponse({"error": "Not found"}, status=404)

    elif request.method == "PUT":
        data = json.loads(request.body)
        result = collection.update_one(filter_query, {"$set": data})

        if result.matched_count:
            # Si cambiaron coordenadas, actualizamos Redis GEO
            key = data.get("iata_faa") or data.get("icao") or iata
            lat = data.get("lat")
            lng = data.get("lng")
            if key and lat and lng:
                redis_client.geoadd("airports", (lng, lat, key))
                print("♻️ Redis GEO actualizado:", key, lat, lng)

            return JsonResponse({"message": "Airport updated"})
        return JsonResponse({"error": "Airport not found"}, status=404)

    elif request.method == "DELETE":
        # Buscamos primer el documento para obtener la clave real
        airport = collection.find_one(filter_query)
        if airport:
            # Clave que usamos en Redis
            key = airport.get("iata_faa") or airport.get("icao")
            # Borramos de MongoDB
            collection.delete_one({"_id": airport["_id"]})
            # Borramos de Redis Popularidad y GEO
            redis_client.zrem(POPULARITY_KEY, key)
            redis_client.zrem("airports", key)
            return JsonResponse({"message": "Airport deleted"})
        return JsonResponse({"error": "Airport not found"}, status=404)


def get_nearby_airports(request):
    lat = float(request.GET.get("lat"))
    lng = float(request.GET.get("lng"))
    radius = float(request.GET.get("radius"))
    nearby = redis_client.georadius("airports", lng, lat, radius, unit="km")
    return JsonResponse({"nearby": nearby})


def get_popular_airports(request):
    top = redis_client.zrevrange(POPULARITY_KEY, 0, 9, withscores=True)
    return JsonResponse({"popular": top})
