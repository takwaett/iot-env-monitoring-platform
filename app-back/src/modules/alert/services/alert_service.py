from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import joinedload
from src.modules.alert.models.alert_model import AlertModel
from src.modules.node.models.node_model import NodeModel  # Importation indispensable pour la jointure

class AlertService:
    # 1. RÉCUPÉRATION DE TOUTES LES ALERTES DE L'UTILISATEUR
    async def get_all_alerts(self, db: AsyncSession, user_id: int):
        try:
            query = (
                select(AlertModel)
                .join(NodeModel, AlertModel.node_id == NodeModel.id)
                .where(NodeModel.user_id == user_id)
                .options(joinedload(AlertModel.node), joinedload(AlertModel.sensor))
                .order_by(AlertModel.created_at.desc())
            )
            result = await db.execute(query)
            return result.scalars().all()
        except Exception as e:
            print(f"❌ Erreur SQL dans get_all_alerts: {e}")
            raise e

    # 2. RÉCUPÉRATION DES ALERTES DE TYPE DANGER DE L'UTILISATEUR
    async def get_danger_alerts(self, db: AsyncSession, user_id: int):
        try:
            # CORRECTION : Ajout du filtre de statut "danger" + filtrage par user_id
            query = (
                select(AlertModel)
                .join(NodeModel, AlertModel.node_id == NodeModel.id)
                .where(NodeModel.user_id == user_id, AlertModel.alert == "danger")
                .options(joinedload(AlertModel.node), joinedload(AlertModel.sensor))
                .order_by(AlertModel.created_at.desc())
            )
            result = await db.execute(query)
            return result.scalars().all()
        except Exception as e:
            print(f"❌ Erreur SQL dans get_danger_alerts: {e}")
            raise e

    # 3. SUPPRESSION SÉCURISÉE D'UNE ALERTE
    async def delete_alert(self, db: AsyncSession, alert_id: int, user_id: int):
        try:
            query = (
                select(AlertModel)
                .join(NodeModel, AlertModel.node_id == NodeModel.id)
                .where(AlertModel.id == alert_id, NodeModel.user_id == user_id)
            )
            result = await db.execute(query)
            alert = result.scalar_one_or_none()
            if alert:
                await db.delete(alert)
                await db.commit()
                return True
            return False
        except Exception as e:
            await db.rollback()
            return False

    # 4. MODIFICATION SÉCURISÉE D'UNE ALERTE
    async def update_alert(self, db: AsyncSession, alert_id: int, alert_data, user_id: int):
        try:
            query = (
                select(AlertModel)
                .join(NodeModel, AlertModel.node_id == NodeModel.id)
                .where(AlertModel.id == alert_id, NodeModel.user_id == user_id)
            )
            result = await db.execute(query)
            db_alert = result.scalar_one_or_none()
            if db_alert:
                db_alert.message = alert_data.message
                db_alert.alert = alert_data.alert
                await db.commit()
                await db.refresh(db_alert)
                return db_alert
            return None
        except Exception as e:
            await db.rollback()
            raise e

alert_service = AlertService()
