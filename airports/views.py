from django.shortcuts import render

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
import pymongo
import redis

from django.views.decorators.http import require_http_methods
# Conexiones
mongo_client = pymongo.MongoClient("mongodb://admin:admin123@aeropuerto-mongo:27017/", authSource="admin")
db = mongo_client["airport_db"]
collection = db["airports"]

redis_client = redis.Redis(host="aeropuerto-redis", port=6379, decode_responses=True)
POPULARITY_KEY = "airport_popularity"
redis_client.expire(POPULARITY_KEY, 86400)  # TTL de 1 día

@csrf_exempt
@require_http_methods(["GET", "POST"])
def handle_airports(request):
    if request.method == "GET":
        airports = list(collection.find({}, {"_id": 0}))
        return JsonResponse(airports, safe=False)

    elif request.method == "POST":
        data = json.loads(request.body)
        collection.insert_one(data)
        key = data.get("iata_faa") or data.get("icao")
        lat = data.get("lat")
        lng = data.get("lng")
        if key and lat and lng:
            redis_client.geoadd("airports", (lng, lat, key))
        return JsonResponse({"message": "Airport created"}, status=201)


@csrf_exempt
@require_http_methods(["GET", "PUT", "DELETE"])
def handle_airport_by_iata(request, iata):
    if request.method == "GET":
        airport = collection.find_one({"$or": [{"iata_faa": iata}, {"icao": iata}]}, {"_id": 0})
        if airport:
            redis_client.zincrby(POPULARITY_KEY, 1, iata)
            redis_client.expire(POPULARITY_KEY, 86400)
            return JsonResponse(airport)
        return JsonResponse({"error": "Not found"}, status=404)

    elif request.method == "PUT":
        data = json.loads(request.body)
        result = collection.update_one({"iata_faa": iata}, {"$set": data})
        if result.matched_count:
            return JsonResponse({"message": "Airport updated"})
        return JsonResponse({"error": "Airport not found"}, status=404)

    elif request.method == "DELETE":
        collection.delete_one({"iata_faa": iata})
        redis_client.zrem(POPULARITY_KEY, iata)
        redis_client.zrem("airports", iata)
        return JsonResponse({"message": "Airport deleted"})


def get_nearby_airports(request):
    lat = float(request.GET.get("lat"))
    lng = float(request.GET.get("lng"))
    radius = float(request.GET.get("radius"))
    nearby = redis_client.georadius("airports", lng, lat, radius, unit="km")
    return JsonResponse({"nearby": nearby})

def get_popular_airports(request):
    top = redis_client.zrevrange(POPULARITY_KEY, 0, 9, withscores=True)
    return JsonResponse({"popular": top})
