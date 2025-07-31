## Proyecto Integrador - MVP - aPSIstance

**Alumno:** Capo, Pablo  

**Docente:** Erick Ravelo

**Materia:** Técnicas de Procesamiento Digital de Imágenes  

**Carrera:** Tecnicatura Superior en Ciencia de Datos e Inteligencia Artificial  

**Institución:** IFTS N.º 24 - CABA

MVP desarrollado para la materia Proyecto Integrador de la Tecnicatura Superior en Ciencia de Datos e Inteligencia Artificial en el I.F.T.S N° 24.
Aplicación para psicólogos que busca una "Gestión eficiente para un acompañamiento de calidad".

## Memoria Descriptiva

aPSIstance es una aplicación diseñada como un Producto Mínimo Viable (MVP) para asistir a terapeutas en la gestión eficiente de sus pacientes y sesiones. Su objetivo principal es centralizar el historial clínico, facilitar el registro de las interacciones y permitir un seguimiento claro del progreso de cada individuo bajo terapia. La aplicación busca simplificar la administración diaria del terapeuta, permitiéndole enfocarse más en el acompañamiento de sus pacientes.

## Aspectos destacados del MVP

Durante el desarrollo de este MVP, se abordaron las siguientes funcionalidades clave:

Autenticación de Usuarios: Acceso seguro para terapeutas al sistema.

Gestión Integral de Pacientes: Permite al terapeuta crear, visualizar, editar y listar a todos sus pacientes.

Registro Detallado de Sesiones: Facilita la creación de registros por cada sesión, incluyendo notas por audio o escritas , tipo de sesión, duración y un indicador del estado emocional.

Historial Clínico Dinámico: Visualización clara y ordenada de todas las sesiones registradas para un paciente específico, ordenadas cronológicamente.

Descarga de Historial en PDF: Funcionalidad para exportar el historial completo de sesiones de un paciente a un archivo PDF para impresión o archivo digital.

Búsqueda y Selección de Pacientes: Herramientas intuitivas para encontrar y seleccionar pacientes rápidamente.

## Tecnologías Utilizadas

Este proyecto fue construido utilizando un enfoque de stack completo (full-stack), combinando las siguientes tecnologías:

**Frontend (Aplicación Web):**

React: Biblioteca de JavaScript para construir interfaces de usuario interactivas.

TypeScript: Superset de JavaScript que añade tipado estático para mayor robustez.

Vite: Herramienta de construcción de frontend rápida y ligera.

Tailwind CSS: Framework CSS utility-first para un diseño rápido y flexible.

Shadcn/ui: Componentes de interfaz de usuario construidos con Tailwind CSS y React.

date-fns: Librería para el manejo y formato de fechas.

sonner: Librería para notificaciones "toast".

react-router-dom: Para el enrutamiento dentro de la aplicación.

lucide-react: Librería de iconos.

jspdf & html2canvas: Para la generación de archivos PDF a partir del contenido HTML del historial.


**Backend (API):**

FastAPI: Framework web de Python moderno, rápido y asíncrono para construir APIs.

Python: Lenguaje de programación principal para el backend.

SQLAlchemy: Toolkit SQL y ORM (Mapeador Objeto-Relacional) para interactuar con la base de datos.

Uvicorn: Servidor ASGI para ejecutar la aplicación FastAPI.


**Base de Datos:**

PostgreSQL: Base de datos ligera basada en archivos, utilizada para el desarrollo y almacenamiento local de los datos.


## Cómo Instalar y Ejecutar el Proyecto
Sigue estos pasos para poner en marcha aPSIStance en tu entorno local:

Prerrequisitos
Asegúrate de tener instalado lo siguiente:

Node.js (versión 18 o superior recomendada) y npm (o yarn).

Python (versión 3.9 o superior recomendada) y pip.

Configuración del Backend
Clonar el repositorio:

Bash

git clone https://github.com/tu-usuario/mindful-therapy-compass.git
cd mindful-therapy-compass
(Ajusta la URL del repositorio a la tuya).

Navegar al directorio del backend:

Bash

cd backend
Crear y activar un entorno virtual (recomendado):

Bash

python -m venv venv
# En Windows:
.\venv\Scripts\activate
# En macOS/Linux:
source venv/bin/activate
Instalar las dependencias de Python:

Bash

pip install -r requirements.txt
Ejecutar el servidor de la API:

Bash

uvicorn main:app --reload
La API estará disponible en http://localhost:8000.

Configuración del Frontend
Navegar al directorio del frontend:

Bash

cd ../frontend # Volver al directorio raíz del proyecto y luego ir a frontend
(Asegúrate de que estás en la raíz de mindful-therapy-compass y luego entras a frontend).

Instalar las dependencias de Node.js:

Bash

npm install # O yarn install
Iniciar la aplicación React:

Bash

npm run dev # O yarn dev
La aplicación estará disponible en http://localhost:5173 (o el puerto que te indique Vite).

Uso del MVP
Una vez que tanto el backend como el frontend estén ejecutándose, podrás acceder a la aplicación en tu navegador. Puedes crear un nuevo terapeuta (si la API lo permite), iniciar sesión y comenzar a gestionar pacientes y sus sesiones.

Demostración Visual
Enlace al video de demostración de tu MVP (¡Cuando lo tengas listo!)

Ramas del Repositorio
Actualmente, el repositorio cuenta con las siguientes ramas principales para la gestión del desarrollo:

develop: Rama principal para la integración de nuevas características y trabajo en curso.

feature/audio-transcripcion: Rama dedicada al desarrollo de la funcionalidad de transcripción de audio.

inicial: Rama de referencia (puede ser fusionada en develop y luego eliminada si no es necesaria para el historial).

SinLogin: Rama de referencia (puede ser fusionada en develop y luego eliminada si no es necesaria para el historial).

Se recomienda trabajar en ramas de características separadas y luego fusionar en develop a través de Pull Requests.
- Tailwind CSS
