from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    DB_HOST: str
    DB_PORT: int
    DB_NAME: str
    DB_USER: str
    DB_PASSWORD: str
    DATABASE_URL: str

    # config influx 
    INFLUXDB_URL: str
    INFLUXDB_TOKEN: str
    INFLUXDB_ORG: str
    INFLUXDB_BUCKET: str

    # config  mqtt 
    MQTT_BROKER: str
    MQTT_PORT: int
    MQTT_TOPIC: str

    # Sécurité JWT 
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    #  Configuration Email 
    EMAIL_USERNAME: str
    EMAIL_PASSWORD: str
    EMAIL_FROM: str
    EMAIL_PORT: int
    EMAIL_SERVER: str
    EMAIL_STARTTLS: bool
    EMAIL_SSL_TLS: bool
    EMAIL_USE_CREDENTIALS: bool

model_config = SettingsConfigDict(
        env_file=".env", 
        env_file_encoding="utf-8",
        extra="ignore" # Ignore les variables en trop pour éviter les erreurs
    )

  

settings = Settings()
