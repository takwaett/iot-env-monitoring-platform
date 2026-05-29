"""reset_pfe

Revision ID: dc7ba0450c0e
Revises: 
Create Date: 2026-05-23 21:07:14.360635

"""
from alembic import op
import sqlalchemy as sa

# Imports de vos modèles et de la configuration de votre base de données
from src.utils.database import Base
from src.modules.node.models.node_model import NodeModel
from src.modules.sensor.models.sensor_model import SensorModel
from src.modules.measurement.models.measurement_model import MeasurementModel
from src.modules.alert.models.alert_model import AlertModel
from src.modules.threshold.models.threshold_model import ThresholdModel
from src.modules.auth.models.user_model import UserModel

# revision identifiers, used by Alembic.
revision = 'dc7ba0450c0e'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Récupère la connexion active d'Alembic et crée toutes les tables d'un coup
    bind = op.get_bind()
    Base.metadata.create_all(bind=bind)


def downgrade() -> None:
    # Supprime toutes les tables si on annule la migration
    bind = op.get_bind()
    Base.metadata.drop_all(bind=bind)
