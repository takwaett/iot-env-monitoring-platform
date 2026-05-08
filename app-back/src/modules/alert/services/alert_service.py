from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import joinedload # jointures
from src.modules.alert.models.alert_model import AlertModel

class AlertService:
    # récupération de  TOUTES LES ALERTES 
    async def get_all_alerts(self, db: AsyncSession):
        try:
            query = (
                select(AlertModel)
                .options(joinedload(AlertModel.node), joinedload(AlertModel.sensor))
                .order_by(AlertModel.created_at.desc())
            )
            result = await db.execute(query)
            return result.scalars().all()
        except Exception as e:
            print(f"❌ Erreur SQL dans get_all_alerts: {e}")
            raise e

    # récupération des alertes de type danger
    async def get_danger_alerts(self, db: AsyncSession):
        try:
            query = (
                select(AlertModel)
                .options(joinedload(AlertModel.node), joinedload(AlertModel.sensor))
                .order_by(AlertModel.created_at.desc())
            )
            result = await db.execute(query)
            return result.scalars().all()
        except Exception as e:
            print(f"❌ Erreur SQL dans get_danger_alerts: {e}")
            raise e

    # suppression
    async def delete_alert(self, db: AsyncSession, alert_id: int):
        try:
            query = select(AlertModel).where(AlertModel.id == alert_id)
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

    # modification
    async def update_alert(self, db: AsyncSession, alert_id: int, alert_data):
        try:
            query = select(AlertModel).where(AlertModel.id == alert_id)
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
