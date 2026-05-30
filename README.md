# Nom du projet : Plateforme IoT intelligente de surveillance environnementale en temps réel

---

# Description du projet

Ce projet de fin d’études consiste à concevoir et développer une plateforme IoT permettant la surveillance environnementale en temps réel.  
L’objectif est d’exploiter les technologies IoT pour collecter, transmettre, analyser et visualiser les données issues de capteurs environnementaux.

---

# Stack technique

## Firmware (Microcontrôleur)

- C++ / Arduino Framework
## Logiciel de simulation
-SimulIDE


## Backend

- Python / FastAPI
- Pydantic
- Mosquitto (MQTT Broker)
- aiomqtt
- SQLAlchemy + asyncpg


## Frontend

- React.js
- CSS
- Axios
- WebSocket (natif FastAPI)

## Base de données

- PostgreSQL
- InfluxDB (Time Series Database)

## DevOps / Déploiement

- Docker / Docker Compose
- Git / GitHub

---

# Architecture système

![architecture système](/architecture.png)

Il comprend les éléments suivants :

- Capteurs : (MQ-135, DHT22, BMP280)
- Microcontrôleur : ESP32
- Réseau Wi-Fi
- Serveur backend
- Base de données
- Interface utilisateur (dashboard web)
- Système d’alerte (LED)

---

# Fonctionnement du diagramme

- Les capteurs collectent et transmettent les données à l’ESP32.
- L’ESP32 relaie ensuite ces données via le réseau Wi-Fi.
- Le serveur backend réceptionne, analyse et traite les données.
- Les informations sont ensuite enregistrées dans une base de données.
- L’interface utilisateur accède à ces données pour les afficher.
- Si un seuil est franchi, le système active des alertes.

---

# Installation et lancement de chaque composant

# Simulateur (SimulIDE)

Avant de lancer le projet, assurez-vous d’installer les outils suivants :

## SimulIDE

Logiciel de simulation téléchargeable à partir du lien suivant :

https://simulide.com/p/downloads/

## Arduino IDE 2.3.8

Téléchargeable à partir du lien suivant :

https://support.arduino.cc/hc/en-us/articles/360019833020-Download-and-install-Arduino-IDE

## PostgreSQL

Système de gestion de base de données relationnelle téléchargeable à partir du lien suivant :

https://www.postgresql.org/download/

## Python 3.13

Téléchargeable à partir du lien suivant :

https://www.python.org/downloads/

---

# Étapes à suivre pour lancer le projet

## 1 - Lancer la simulation

Lancer le fichier du montage nommé `montage.sim1` situé dans l’emplacement suivant :

```txt
simulation/montage.sim1
```

Charger le firmware Arduino IDE exporté sous format binaire situé dans l’emplacement suivant :

```txt
firmware/build/arduino.avr.uno/firmware.ino.hex
```

dans la carte Arduino Uno.

Faire un clic droit sur la carte Arduino Uno, choisir **"Charger le firmware"**, puis sélectionner le fichier :

```txt
firmware.ino.hex
```

Ensuite, lancer la simulation.

---

## 2 - Envoyer les données vers la base de données

Exécuter le script Python situé dans l’emplacement suivant :

```txt
simulation/data-sender.py
```

en utilisant la commande suivante :

```bash
python data-sender.py
```

Ce script permet d’envoyer les mesures en temps réel vers la base de données.

---

## Résultat attendu

- Simulation fonctionnelle dans SimulIDE
- Données générées par les capteurs
- Envoi des données en temps réel
- Stockage automatique dans PostgreSQL

---

# PostgreSQL

Avant de lancer le projet, assurez-vous d’installer les outils suivants :

## PostgreSQL (base de données relationnelle)

Téléchargeable à partir du lien suivant :

https://postgresql.org/download/windows/

Version recommandée : PostgreSQL 15+

---

## Installation de PostgreSQL

- Télécharger l’installateur `.exe` pour Windows
- Lancer l’installateur `.exe`

---

## Configurer les paramètres nécessaires

- Port : `5432` (par défaut)
- Mot de passe : à conserver précieusement
- Locale : Default locale

---

## Créer une base de données pour le projet avec pgAdmin 4

- Lancer pgAdmin (installé avec PostgreSQL)
- Cliquer sur **"Add New Server"**

### Onglet "General"

Nom :

```txt
postgres
```

### Onglet "Connection"

Entrer les informations suivantes :

```txt
Host : localhost
Port : 5432
Username : postgres
Password : votre mot de passe
```

Faire un clic droit sur **"Databases"** → **"Create"** → **"Database"**

Cliquer ensuite sur la base créée pour la lancer.

---

# Frontend

# Prérequis

Avant de commencer, assurez-vous d’avoir les outils suivants :

| Outil | Version | Vérification |
|---|---|---|
| Node.js | 18.x ou supérieur | `node --version` |
| npm | 9.x ou supérieur | `npm --version` |

---

Si Node.js n’est pas installé, téléchargez-le depuis :

https://nodejs.org/

---

# Installation et lancement du frontend

Se rendre dans le dossier du frontend en utilisant la commande suivante :

```bash
cd app-front
```

Installer toutes les dépendances :

```bash
npm install
```

Lancer le projet :

```bash
npm start
```

---

# Backend

# Prérequis

Avant de commencer, assurez-vous d’avoir les outils suivants :

| Outil | Version | Vérification |
|---|---|---|
| Python | 3.10 ou supérieur | `python --version` |
| pip | 22.x ou supérieur | `pip --version` |

---

Si Python n’est pas installé, téléchargez-le depuis le lien suivant :

https://python.org/

---

# Installation et lancement du backend

Se rendre dans le dossier du backend :

```bash
cd app-back
```

Créer un environnement virtuel :

```bash
python -m venv venv
```

Activer l’environnement virtuel :

```bash
venv\Scripts\activate
```

Installer les dépendances :

```bash
pip install -r requirements.txt
```

Lancer le projet :

```bash
uvicorn src.main:app --reload
```