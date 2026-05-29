# 🌱 EnviroSense - Interface utilisateur

EnviroSense est une application web de supervision environnementale.  
Ce dépôt contient l'interface frontend développée en **React.js**.  
Elle permet de visualiser les données des capteurs en temps réel, la configuration des nœuds, des capteurs, des seuils et des alertes, ainsi que la gestion de la planification des rapports PDF automatiques et l’affichage des gaz multi-substances issus du capteur MQ135.

---

## 🚀 Fonctionnalités Principales

* **Tableau de bord en temps réel** : Visualisation des graphiques d’évolution (température, humidité, pression et qualité de l’air), affichage de la météo actuelle, ainsi que des graphiques et listes des alertes de type danger.
* **Gestion des alertes** : Configuration des seuils critiques avec notifications visuelles.
* **Configuration des rapports (APScheduler)** : Interface dédiée pour activer/désactiver les rapports quotidiens et hebdomadaires.
* **Historique des rapports** : Consultation et téléchargement direct des anciens rapports PDF générés.
* **Gaz multi-substances du MQ135** : Affichage des valeurs des 6 gaz détectés avec leurs mini-graphiques.

---

## 🛠️ Technologies Utilisées

* **Framework** : React.js (v18+)
* **Gestion d’état** : Context API
* **Routage** : React Router v6
* **Graphiques** : Chart.js / Recharts (pour la visualisation dynamique)
* **Style & UI** : CSS

---

## 💻 Installation et lancement du projet

### Prérequis

Avant de commencer, assurez-vous d’avoir installé :

| Outil | Version |
|--------|----------|
| Node.js | v18 ou supérieur |
| npm (Node Package Manager) | Dernière version |

Téléchargement de Node.js :  
https://nodejs.org

---

### Configuration des variables d’environnement

Ajouter la variable suivante dans le fichier `.env` :

```env
REACT_APP_API_URL=http://localhost:8000
```

---

### Installation des dépendances

Exécuter la commande suivante :

```bash
npm install
```

---

### Lancement du serveur de développement

Pour démarrer l’interface utilisateur en mode développement, exécutez la commande suivante dans le terminal :

```bash
npm start
```

L’application sera accessible à l’adresse suivante :

```txt
http://localhost:3000
```