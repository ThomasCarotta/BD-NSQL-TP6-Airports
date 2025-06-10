# Usa Python oficial
FROM python:3.10-slim

# Establece directorio de trabajo
WORKDIR /app

# Copia todos los archivos del proyecto al contenedor
COPY . .

# Instala dependencias de Python
RUN pip install --no-cache-dir -r requirements.txt

# Ejecuta la carga de datos
CMD ["python", "scripts/cargar_datos.py"]
