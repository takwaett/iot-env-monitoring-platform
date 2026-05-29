
# Documentation de la Base de Données

## 1. Modèle Conceptuel de Données (MCD) et Modèle Logique de Données (MLD)

### Diagramme Entité-Relation

![Architecture Système](./assets/database.png)

---

## 2. Clés Étrangères (Foreign Keys)

| Table         | Clé étrangère | Référence    |
| ------------- | ------------- | ------------ |
| `nodes`       | `user_id`     | `users.id`   |
| `sensors`     | `node_id`     | `nodes.id`   |
| `measurement` | `sensor_id`   | `sensors.id` |
| `thresholds`  | `sensor_id`   | `sensors.id` |

---

# 3. Dictionnaire des Données

## Table : users

| Champ         | Type    | Contraintes      | Description                              |
| ------------- | ------- | ---------------- | ---------------------------------------- |
| `id`          | INT     | PRIMARY KEY      | Identifiant unique de l'utilisateur      |
| `nom`         | VARCHAR | NOT NULL         | Nom de l'utilisateur                     |
| `prenom`      | VARCHAR | NOT NULL         | Prénom de l'utilisateur                  |
| `email`       | VARCHAR | UNIQUE, NOT NULL | Adresse e-mail de connexion              |
| `motDePasse`  | VARCHAR | NOT NULL         | Mot de passe hashé                       |
| `role`        | ENUM    | `admin`, `user`  | Rôle de l'utilisateur                    |
| `reset_code`  | VARCHAR | NULL             | Code de réinitialisation du mot de passe |
| `is_verified` | BOOLEAN | DEFAULT FALSE    | Statut de vérification du compte         |

---

## Table : nodes

| Champ          | Type    | Contraintes              | Description                     |
| -------------- | ------- | ------------------------ | ------------------------------- |
| `id`           | INT     | PRIMARY KEY              | Identifiant du nœud             |
| `name`         | VARCHAR | NULL                     | Nom personnalisé du nœud        |
| `localisation` | VARCHAR | NULL                     | Emplacement physique du nœud    |
| `statut`       | VARCHAR | NULL                     | État du nœud (Online / Offline) |
| `adresseIP`    | VARCHAR | NULL                     | Adresse IP du nœud              |
| `user_id`      | INT     | FOREIGN KEY → `users.id` | Propriétaire du nœud            |

---

## Table : sensors

| Champ        | Type     | Contraintes              | Description                                   |
| ------------ | -------- | ------------------------ | --------------------------------------------- |
| `id`         | INT      | PRIMARY KEY              | Identifiant du capteur                        |
| `name`       | VARCHAR  | NULL                     | Nom du capteur                                |
| `type`       | VARCHAR  | NULL                     | Type du capteur (Température, Humidité, etc.) |
| `status`     | VARCHAR  | NULL                     | État du capteur                               |
| `created_at` | DATETIME | DEFAULT NOW()            | Date de création                              |
| `updated_at` | DATETIME | AUTO                     | Date de dernière modification                 |
| `node_id`    | INT      | FOREIGN KEY → `nodes.id` | Nœud associé                                  |

---

## Table : measurement

| Champ        | Type     | Contraintes                | Description              |
| ------------ | -------- | -------------------------- | ------------------------ |
| `id`         | INT      | PRIMARY KEY                | Identifiant de la mesure |
| `value`      | FLOAT    | NOT NULL                   | Valeur mesurée           |
| `created_at` | DATETIME | DEFAULT NOW()              | Horodatage de création   |
| `updated_at` | DATETIME | AUTO                       | Date de mise à jour      |
| `sensor_id`  | INT      | FOREIGN KEY → `sensors.id` | Capteur source           |

---

## Table : thresholds

| Champ       | Type    | Contraintes                | Description          |
| ----------- | ------- | -------------------------- | -------------------- |
| `id`        | INT     | PRIMARY KEY                | Identifiant du seuil |
| `sensor_id` | INT     | FOREIGN KEY → `sensors.id` | Capteur ciblé        |
| `node_id`   | INT     | NOT NULL                   | Nœud associé         |
| `type`      | VARCHAR | NOT NULL                   | Type du seuil        |
| `minval`    | FLOAT   | NOT NULL                   | Valeur minimale      |
| `maxval`    | FLOAT   | NOT NULL                   | Valeur maximale      |

---

## Table : report_configs

| Champ              | Type     | Contraintes     | Description                           |
| ------------------ | -------- | --------------- | ------------------------------------- |
| `id`               | INT      | PRIMARY KEY     | Identifiant de configuration          |
| `daily_enabled`    | BOOLEAN  | DEFAULT TRUE    | Activation des rapports quotidiens    |
| `weekly_enabled`   | BOOLEAN  | DEFAULT TRUE    | Activation des rapports hebdomadaires |
| `recipient_emails` | JSON     | DEFAULT []      | Liste des e-mails destinataires       |
| `daily_config`     | JSON     | DEFAULT `{...}` | Configuration quotidienne             |
| `weekly_config`    | JSON     | DEFAULT `{...}` | Configuration hebdomadaire            |
| `updated_at`       | DATETIME | AUTO            | Date de dernière modification         |

---

## Table : report_history

| Champ        | Type     | Contraintes      | Description                 |
| ------------ | -------- | ---------------- | --------------------------- |
| `id`         | INT      | PRIMARY KEY      | Identifiant de l’historique |
| `type`       | VARCHAR  | NOT NULL         | Type du rapport             |
| `period`     | VARCHAR  | NOT NULL         | Période du rapport          |
| `date`       | VARCHAR  | NOT NULL         | Date de génération          |
| `recipients` | VARCHAR  | NOT NULL         | Destinataires du rapport    |
| `status`     | VARCHAR  | DEFAULT `Envoyé` | Statut du rapport           |
| `path`       | VARCHAR  | NULL             | Chemin du fichier PDF       |
| `created_at` | DATETIME | DEFAULT NOW()    | Date de création            |

---

# 4. Scripts SQL (DDL)

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    motDePasse VARCHAR(255) NOT NULL,
    role VARCHAR(10) DEFAULT 'user' CHECK (role IN ('admin', 'user')),
    reset_code VARCHAR(255),
    is_verified BOOLEAN DEFAULT FALSE
);

CREATE TABLE nodes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    localisation VARCHAR(255),
    statut VARCHAR(50),
    adresseIP VARCHAR(45),
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE sensors (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    type VARCHAR(50),
    status VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    node_id INT NOT NULL REFERENCES nodes(id) ON DELETE CASCADE
);

CREATE TABLE measurement (
    id SERIAL PRIMARY KEY,
    value FLOAT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sensor_id INT NOT NULL REFERENCES sensors(id) ON DELETE CASCADE
);

CREATE TABLE thresholds (
    id SERIAL PRIMARY KEY,
    sensor_id INT NOT NULL REFERENCES sensors(id) ON DELETE CASCADE,
    node_id INT NOT NULL,
    type VARCHAR(50) NOT NULL,
    minval FLOAT NOT NULL,
    maxval FLOAT NOT NULL
);

CREATE TABLE report_configs (
    id SERIAL PRIMARY KEY,
    daily_enabled BOOLEAN DEFAULT TRUE,
    weekly_enabled BOOLEAN DEFAULT TRUE,
    recipient_emails JSON DEFAULT '[]',
    daily_config JSON DEFAULT '{"time": "08:00"}',
    weekly_config JSON DEFAULT '{"time": "09:00", "day": "Monday"}',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE report_history (
    id SERIAL PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    period VARCHAR(255) NOT NULL,
    date VARCHAR(50) NOT NULL,
    recipients VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'Envoyé',
    path VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 5. Triggers SQL

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_sensors_updated_at
BEFORE UPDATE ON sensors
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_measurement_updated_at
BEFORE UPDATE ON measurement
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

```

---

## 6. Index SQL

```sql
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_nodes_user_id ON nodes(user_id);
CREATE INDEX idx_sensors_node_id ON sensors(node_id);
CREATE INDEX idx_measurement_sensor_id ON measurement(sensor_id);
CREATE INDEX idx_measurement_created_at ON measurement(created_at);
```

---

# 7. Base de Données Time-Series (InfluxDB)

## 7.1 Configuration du Bucket

| Élément              | Valeur                |
| -------------------- | --------------------- |
| **Bucket**           | `iot_data`            |
| **Measurement**      | `environment_metrics` |
| **Rétention**        | 30 jours              |
| **Type de stockage** | Time-Series (TSM)     |

---

## 7.2 Structure des Tags (Indexés)

| Tag          | Type   | Description                   | Correspondance PostgreSQL |
| ------------ | ------ | ----------------------------- | ------------------------- |
| `node_id`    | string | Identifiant unique du nœud    | `nodes.id`                |
| `node_label` | string | Nom personnalisé du nœud      | `nodes.name`              |
| `sensor_id`  | string | Identifiant unique du capteur | `sensors.id`              |

---

## 7.3 Structure des Fields (Valeurs Mesurées)

| Field         | Type  | Unité | Description                |
| ------------- | ----- | ----- | -------------------------- |
| `temperature` | float | °C    | Température ambiante       |
| `humidity`    | float | %     | Humidité relative          |
| `pressure`    | float | hPa   | Pression atmosphérique     |
| `air_quality` | int   | ppm   | Indice de qualité de l’air |
| `gas_co2`     | float | ppm   | Dioxyde de carbone         |
| `gas_smoke`   | float | ppm   | Fumée et particules fines  |
| `gas_alcohol` | float | ppm   | Alcool / Éthanol           |
| `gas_benzene` | float | ppm   | Benzène                    |
| `gas_nh3`     | float | ppm   | Ammoniac                   |
| `gas_nox`     | float | ppm   | Oxydes d’azote             |

---

## 7.4 Requêtes InfluxQL Essentielles

| Requête                                                                                          | Description                               |
| ------------------------------------------------------------------------------------------------ | ----------------------------------------- |
| `SELECT * FROM "environment_metrics" ORDER BY time DESC LIMIT 50`                                | Afficher les 50 dernières mesures         |
| `SELECT * FROM "environment_metrics" WHERE time > now() - 1h`                                    | Afficher les données de la dernière heure |
| `SELECT MEAN(temperature) FROM "environment_metrics" WHERE time > now() - 24h GROUP BY time(1h)` | Moyenne horaire de la température         |
| `SELECT LAST(temperature) FROM "environment_metrics" GROUP BY node_label`                        | Dernière température par nœud             |
| `SELECT temperature FROM "environment_metrics" WHERE temperature > 40`                           | Détection de température excessive        |

---

## 7.5 Commandes InfluxDB CLI

| Commande                                                                                   | Description           |                        |
| ------------------------------------------------------------------------------------------ | --------------------- | ---------------------- |
| `influx bucket list`                                                                       | Lister les buckets    |                        |
| `influx query 'from(bucket:"iot_data")                                                     | > range(start: -1h)'` | Interroger les données |
| `influx bucket create --name iot_data --retention 30d`                                     | Créer un bucket       |                        |
| `influx delete --bucket iot_data --start 2026-05-01T00:00:00Z --stop 2026-05-26T00:00:00Z` | Supprimer des données |                        |





# Conclusion

Cette base de données permet la gestion complète d’un système IoT de surveillance environnementale. PostgreSQL est utilisé pour le stockage relationnel des utilisateurs, capteurs, alertes et configurations, tandis qu’InfluxDB assure le stockage optimisé des données temporelles issues des capteurs en temps réel.


