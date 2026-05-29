# src/modules/Report/scheduler.py
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from sqlalchemy.ext.asyncio import AsyncSession
import asyncio

from src.modules.Report.services.Report_service import ReportService
from src.utils.database import AsyncSessionLocal


# Instance globale du scheduler
scheduler = AsyncIOScheduler()
report_service = ReportService()

async def scheduled_daily_report():
    """Exécution du rapport quotidien planifié"""
    print("📅 Déclenchement du rapport quotidien planifié...")
    async with AsyncSessionLocal() as db:
        try:
            config = await report_service.get_or_create_config(db)
            if config.daily_enabled:
                print("📊 Génération du rapport quotidien...")
                success = await report_service.generate_and_send_report(db, "daily")
                if success:
                    print("✅ Rapport quotidien généré et envoyé avec succès")
                else:
                    print("❌ Échec de la génération du rapport quotidien")
            else:
                print("ℹ️ Rapport quotidien désactivé dans la configuration")
        except Exception as e:
            print(f"❌ Erreur lors du rapport quotidien planifié: {e}")

async def scheduled_weekly_report():
    """Exécution du rapport hebdomadaire planifié"""
    print("📅 Déclenchement du rapport hebdomadaire planifié...")
    async with AsyncSessionLocal() as db:
        try:
            config = await report_service.get_or_create_config(db)
            if config.weekly_enabled:
                print("📊 Génération du rapport hebdomadaire...")
                success = await report_service.generate_and_send_report(db, "weekly")
                if success:
                    print("✅ Rapport hebdomadaire généré et envoyé avec succès")
                else:
                    print("❌ Échec de la génération du rapport hebdomadaire")
            else:
                print("ℹ️ Rapport hebdomadaire désactivé dans la configuration")
        except Exception as e:
            print(f"❌ Erreur lors du rapport hebdomadaire planifié: {e}")

def start_scheduler():
    """Démarre le planificateur avec les jobs configurés"""
    try:
        # Nettoyer les jobs existants
        scheduler.remove_all_jobs()
        
        # Rapport quotidien à 08:00
        scheduler.add_job(
            scheduled_daily_report,
            trigger=CronTrigger(hour=8, minute=0),
            id="daily_report",
            name="Rapport quotidien",
            replace_existing=True,
            max_instances=1
        )
        print("✅ Job 'Rapport quotidien' configuré pour 08:00")
        
        # Rapport hebdomadaire le lundi à 08:00
        scheduler.add_job(
            scheduled_weekly_report,
            trigger=CronTrigger(day_of_week="mon", hour=8, minute=0),
            id="weekly_report",
            name="Rapport hebdomadaire",
            replace_existing=True,
            max_instances=1
        )
        print("✅ Job 'Rapport hebdomadaire' configuré pour le lundi à 08:00")
        
        # Démarrer le scheduler
        scheduler.start()
        print("🚀 Planificateur APScheduler démarré")
        
        # Afficher les jobs configurés
        jobs = scheduler.get_jobs()
        print(f"📋 Jobs configurés: {len(jobs)}")
        for job in jobs:
            print(f"   - {job.name} (ID: {job.id})")
            
    except Exception as e:
        print(f"❌ Erreur au démarrage du scheduler: {e}")
        raise

def stop_scheduler():
    """Arrête le planificateur"""
    try:
        if scheduler.running:
            scheduler.shutdown(wait=False)
            print("🛑 Planificateur arrêté")
    except Exception as e:
        print(f"⚠️ Erreur lors de l'arrêt du scheduler: {e}")

# Pour les tests manuels
if __name__ == "__main__":
    print("🧪 Test du planificateur...")
    start_scheduler()
    
    try:
        # Garder le script en vie pour les tests
        asyncio.get_event_loop().run_forever()
    except KeyboardInterrupt:
        print("\n👋 Arrêt demandé...")
        stop_scheduler()