import redis
import json
from pymongo import MongoClient
from time import sleep
import sys

def conectar_mongo():
    """Intenta conectar a MongoDB con reintentos"""
    max_intentos = 5
    intento = 0

    while intento < max_intentos:
        try:
            client = MongoClient(
                host="aeropuerto-mongo",
                port=27017,
                username="admin",
                password="admin123",
                authSource="admin",
                serverSelectionTimeoutMS=5000,
                connectTimeoutMS=10000
            )
            client.server_info()  # Test de conexión
            return client
        except Exception as e:
            print(f"Intento {intento + 1}: MongoDB no disponible - {str(e)}")
            sleep(5)
            intento += 1

    print("No se pudo conectar a MongoDB después de varios intentos")
    sys.exit(1)

def cargar_datos():
    try:
        print("Iniciando carga de datos...")
        
        # 1. Conectar a MongoDB
        print("Conectando a MongoDB...")
        mongo_client = conectar_mongo()
        db = mongo_client["airport_db"]
        collection = db["airports"]

        # 2. Leer archivo JSON e insertar en MongoDB
        print("Cargando datos en MongoDB...")
        with open("data/airports.json", "r", encoding="utf-8") as f:
            data = json.load(f)
            collection.delete_many({})  # Limpiar colección existente
            result = collection.insert_many(data)
            print(f"Insertados {len(result.inserted_ids)} aeropuertos en MongoDB")

        # 3. Conectar a Redis
        print("Conectando a Redis...")
        redis_geo = redis.Redis(
            host="aeropuerto-redis",
            port=6379,
            decode_responses=True,
            socket_connect_timeout=5
        )
        redis_geo.ping()  # Test de conexión

        # 4. Insertar en Redis GEO con manejo mejorado
        print("Cargando datos geográficos en Redis...")
        airports = list(collection.find(
            {"lat": {"$ne": None, "$gt": -89.99999, "$lt": 89.99999},
            "lng": {"$ne": None, "$gt": -179.99999, "$lt": 179.99999}},
            {"_id": 0, "iata_faa": 1, "icao": 1, "lat": 1, "lng": 1}
        ))

        contador = 0
        errores = 0
        batch_size = 1000  # Procesar en lotes para mejor rendimiento
        total_aeropuertos = len(airports)

        for i in range(0, total_aeropuertos, batch_size):
            batch = airports[i:i + batch_size]
            with redis_geo.pipeline() as pipe:
                for airport in batch:
                    key = airport.get("iata_faa") or airport.get("icao")
                    if key:
                        # Usamos execute_command para evitar problemas con parámetros
                        pipe.execute_command(
                            'GEOADD',
                            'airports',
                            airport["lng"],
                            airport["lat"],
                            key
                        )
                
                try:
                    pipe.execute()
                    contador += len(batch)
                    print(f"Procesados {min(i + batch_size, total_aeropuertos)}/{total_aeropuertos} aeropuertos")
                except redis.exceptions.ResponseError as e:
                    # Si falla el batch, intentamos uno por uno
                    print(f"Error en batch ({i}-{i + batch_size}): {str(e)} - Intentando uno por uno...")
                    for airport in batch:
                        key = airport.get("iata_faa") or airport.get("icao")
                        if key:
                            try:
                                redis_geo.execute_command(
                                    'GEOADD',
                                    'airports',
                                    airport["lng"],
                                    airport["lat"],
                                    key
                                )
                                contador += 1
                            except Exception as e:
                                print(f"⚠️ Error con {key}: {str(e)}")
                                errores += 1

        print(f"\nResumen de carga en Redis GEO:")
        print(f"- Aeropuertos procesados correctamente: {contador}")
        print(f"- Aeropuertos con errores: {errores}")
        print(f"- Total intentados: {total_aeropuertos}")

        # 5. Crear ZSET de popularidad vacío
        print("\nInicializando sistema de popularidad...")
        redis_geo.delete("airport_popularity")  # Limpieza si existe
        redis_geo.expire("airport_popularity", 86400)  # 1 día de vida
        print("Popularidad inicializada (vacía con TTL de 24 horas)")

        print("\n✅ Proceso completado exitosamente")

    except Exception as e:
        print(f"\n❌ Error crítico: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    cargar_datos()