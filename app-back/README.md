# Backend - EnviroSense IoT Platform

## Description

Ce backend est développé avec **FastAPI** et permet :

- la gestion des utilisateurs,
- la réception des données IoT,
- la surveillance des seuils,
- la génération de rapports PDF,
- l’envoi des alertes et des rapports par email,
- la communication avec la base de données PostgreSQL.

---

# Technologies utilisées

- Python 3.11
- FastAPI
- PostgreSQL
- SQLAlchemy
- Alembic
- APScheduler
- ReportLab
- Docker


---

# Prérequis

Avant de lancer le projet, assurez-vous d’avoir les outils suivants installés :

| Outil | Version | Description |
|--------|----------|-------------|
| Python | 3.11 | Langage principal du backend |
| PostgreSQL | 14+ | Base de données relationnelle |
| Docker | Dernière version | Conteneurisation de l’application |
| Git | Dernière version | Gestion du versionnement |

---

# Installation

Installer les dépendances du projet via la commande suivante :

```bash
pip install -r requirements.txt
```

---

# Configuration

Copier le fichier d’environnement en utilisant la commande suivante :

```bash
cp .env.example .env
```

Puis modifier les variables dans le fichier `.env`.

---

# Migrations

Exécuter les migrations Alembic via la commande suivante :

```bash
alembic upgrade head
```

---

# Lancement du backend

Lancer le serveur FastAPI via la commande suivante :

```bash
uvicorn src.main:app --reload
```

---

# Accès au serveur

Le serveur sera accessible sur :

```txt
http://localhost:8000
```

---

# Documentation API

Documentation Swagger auto-générée par FastAPI :

```txt
http://localhost:8000/docs
```

Documentation alternative ReDoc :

```txt
http://localhost:8000/redoc
```

FastAPI génère automatiquement la documentation interactive de toutes les routes API.





