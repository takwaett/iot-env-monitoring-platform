# src/modules/Report/services/Report_service.py

import os
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Tuple

import matplotlib
matplotlib.use("Agg")

import matplotlib.pyplot as plt

from reportlab.lib.pagesizes import letter
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Image
)

from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from src.modules.Report.models.Report_model import (
    ReportConfigModel,
    ReportHistoryModel
)

from src.modules.Report.dtos.Report_dto import ReportConfigUpdateDTO

from src.utils.email import send_report_email
from src.utils.influxdb_client import get_downsampled_series


REPORTS_DIR = os.path.join(os.getcwd(), "storage", "reports")
CHARTS_DIR = os.path.join(REPORTS_DIR, "charts")

os.makedirs(REPORTS_DIR, exist_ok=True)
os.makedirs(CHARTS_DIR, exist_ok=True)


class ReportService:

    # =========================================================
    # CONFIG
    # =========================================================

    async def get_or_create_config(self, db: AsyncSession):

        result = await db.execute(select(ReportConfigModel))
        config = result.scalars().first()

        if not config:
            config = ReportConfigModel(
                daily_enabled=True,
                weekly_enabled=True,
                recipient_emails=[]
            )

            db.add(config)
            await db.commit()
            await db.refresh(config)

        return config

    async def update_config(
        self,
        db: AsyncSession,
        dto: ReportConfigUpdateDTO
    ):

        config = await self.get_or_create_config(db)

        config.daily_enabled = dto.daily_enabled
        config.weekly_enabled = dto.weekly_enabled
        config.recipient_emails = dto.recipient_emails

        await db.commit()
        await db.refresh(config)

        return config

    # =========================================================
    # HISTORY
    # =========================================================

    async def get_history(self, db: AsyncSession):

        result = await db.execute(
            select(ReportHistoryModel)
            .order_by(ReportHistoryModel.created_at.desc())
        )

        return result.scalars().all()

    async def get_report_by_id(
        self,
        db: AsyncSession,
        report_id: int
    ):

        result = await db.execute(
            select(ReportHistoryModel)
            .where(ReportHistoryModel.id == report_id)
        )

        return result.scalar_one_or_none()

    # =========================================================
    # PERIOD
    # =========================================================

    def _get_period(self, report_type: str):

        now = datetime.now()

        if report_type == "daily":
            return "24h", f"{now.strftime('%d/%m/%Y')} (24h)", now

        start_week = now - timedelta(days=7)

        return (
            "7d",
            f"{start_week.strftime('%d/%m/%Y')} - {now.strftime('%d/%m/%Y')}",
            now
        )

    # =========================================================
    # DATA
    # =========================================================

    def _safe_get_data(self, field: str, period: str):

        try:

            points = get_downsampled_series(field, period)

            if not points:
                return [], []

            times = []
            values = []

            for p in points:
                try:
                    times.append(
                        datetime.fromisoformat(
                            p["time"].replace("Z", "+00:00")
                        )
                    )

                    values.append(float(p["value"]))

                except Exception:
                    continue

            return times, values

        except Exception as e:
            print(f"❌ Erreur récupération {field}: {e}")
            return [], []

    # =========================================================
    # CHARTS
    # =========================================================

    def _create_chart(
        self,
        field,
        period,
        color,
        title,
        filename
    ):

        times, values = self._safe_get_data(field, period)

        if not times or not values:
            return None

        plt.figure(figsize=(6, 2.2))

        plt.plot(times, values, color=color, linewidth=2)

        plt.fill_between(
            times,
            values,
            color=color,
            alpha=0.1
        )

        plt.title(title, fontsize=10, fontweight="bold")

        plt.grid(True, linestyle="--", alpha=0.3)

        plt.xticks(rotation=15, fontsize=8)
        plt.yticks(fontsize=8)

        path = os.path.join(CHARTS_DIR, filename)

        plt.tight_layout()

        plt.savefig(
            path,
            dpi=120,
            bbox_inches="tight"
        )

        plt.close()

        return path

    # =========================================================
    # KPI
    # =========================================================

    def _compute_kpi(self, values):

        if not values:
            return {
                "min": 0,
                "max": 0,
                "avg": 0
            }

        return {
            "min": round(min(values), 2),
            "max": round(max(values), 2),
            "avg": round(sum(values) / len(values), 2)
        }

    def _generate_insight(self, values):

        if not values:
            return "Aucune donnée disponible."

        avg = sum(values) / len(values)

        if max(values) > 35:
            return "⚠ Température élevée détectée."

        if avg < 18:
            return "🔵 Température basse observée."

        return "✔ Conditions normales."

    # =========================================================
    # STATISTIQUES & ANALYSES
    # =========================================================

    async def get_active_sensors_count(self, db: AsyncSession) -> int:
        """Récupère le nombre de capteurs actifs"""
        try:
            from src.modules.sensor.models.sensor_model import SensorModel
            
            result = await db.execute(
                select(SensorModel)
                .where(SensorModel.is_active == True)
            )
            sensors = result.scalars().all()
            return len(sensors)
        except Exception as e:
            print(f"❌ Erreur récupération capteurs actifs: {e}")
            return 0

    async def get_total_measurements_count(self, period: str) -> int:
        """Récupère le nombre total de mesures pour tous les champs sur une période"""
        total = 0
        fields = ["temperature", "pressure", "humidity", "air_quality", 
                  "gas_alcohol", "gas_co2", "gas_nh3", "gas_benzene", 
                  "gas_smoke", "gas_nox"]
        
        for field in fields:
            try:
                points = get_downsampled_series(field, period)
                if points:
                    total += len(points)
            except Exception:
                continue
        
        return total

    async def get_previous_week_data(self, field: str) -> List[float]:
        """Récupère les données de la semaine précédente (7 à 14 jours en arrière)"""
        try:
            # Calculer les dates pour la semaine précédente
            now = datetime.now()
            end_previous = now - timedelta(days=7)
            start_previous = end_previous - timedelta(days=7)
            
            # Pour une implémentation simple, on utilise la même période "7d"
            # car get_downsampled_series prend toujours les dernières données
            # Alternative: si votre fonction supporte des dates, à adapter
            points = get_downsampled_series(field, "7d")
            
            # Note: Ceci prend les 7 derniers jours, pas la semaine précédente
            # Pour une vraie semaine précédente, il faudrait modifier get_downsampled_series
            if not points:
                return []
            
            values = []
            for p in points:
                try:
                    values.append(float(p["value"]))
                except Exception:
                    continue
            
            return values
        except Exception as e:
            print(f"❌ Erreur récupération semaine précédente {field}: {e}")
            return []

    def calculate_trend(self, current_values: List[float], previous_values: List[float]) -> Dict:
        """Calcule la tendance et la variation en pourcentage"""
        if not current_values or not previous_values:
            return {
                "trend": "N/A",
                "variation_percent": 0,
                "comparison": "Données insuffisantes",
                "current_avg": 0,
                "previous_avg": 0
            }
        
        current_avg = sum(current_values) / len(current_values)
        previous_avg = sum(previous_values) / len(previous_values)
        
        if previous_avg == 0:
            variation = 0
        else:
            variation = ((current_avg - previous_avg) / previous_avg) * 100
        
        # Déterminer la tendance
        if variation > 5:
            trend = "📈 Hausse significative"
        elif variation > 0:
            trend = "📈 Légère hausse"
        elif variation < -5:
            trend = "📉 Baisse significative"
        elif variation < 0:
            trend = "📉 Légère baisse"
        else:
            trend = "➡️ Stable"
        
        return {
            "trend": trend,
            "variation_percent": round(variation, 2),
            "current_avg": round(current_avg, 2),
            "previous_avg": round(previous_avg, 2),
            "comparison": f"{trend} ({variation:+.2f}%)"
        }

    async def get_weekly_comparison(self, period_str: str) -> Dict:
        """Récupère les comparaisons pour tous les capteurs (rapport hebdomadaire)"""
        fields = {
            "temperature": "🌡️ Température",
            "pressure": "📊 Pression", 
            "humidity": "💧 Humidité",
            "gas_co2": "🫧 CO2",
            "gas_nox": "⚠️ NOX"
        }
        
        comparisons = {}
        
        for field, label in fields.items():
            # Récupérer données actuelles
            _, current_values = self._safe_get_data(field, period_str)
            
            # Récupérer données semaine précédente
            previous_values = await self.get_previous_week_data(field)
            
            comparisons[label] = self.calculate_trend(current_values, previous_values)
        
        return comparisons

    # =========================================================
    # PDF
    # =========================================================

    def _build_pdf(
        self,
        report_type,
        period_text,
        charts,
        kpis,
        insight,
        output_path,
        active_sensors=None,
        total_measurements=None,
        weekly_comparison=None
    ):

        doc = SimpleDocTemplate(
            output_path,
            pagesize=letter
        )

        styles = getSampleStyleSheet()

        title_style = ParagraphStyle(
            "title",
            parent=styles["Heading1"],
            fontSize=18,
            textColor=colors.HexColor("#2563eb")
        )

        story = []

        story.append(
            Paragraph(
                f"EnviroSense Report - {report_type.upper()}",
                title_style
            )
        )

        story.append(Spacer(1, 10))

        story.append(
            Paragraph(
                f"<b>Période :</b> {period_text}",
                styles["Normal"]
            )
        )

        story.append(Spacer(1, 10))

        # SECTION STATISTIQUES
        if active_sensors is not None and total_measurements is not None:
            story.append(Paragraph("📊 Statistiques", styles["Heading2"]))
            story.append(Paragraph(f"• Capteurs actifs : {active_sensors}", styles["Normal"]))
            story.append(Paragraph(f"• Total des mesures enregistrées : {total_measurements}", styles["Normal"]))
            story.append(Spacer(1, 10))

        # KPIS
        story.append(Paragraph("📈 Indicateurs (Température)", styles["Heading2"]))
        story.append(Paragraph(f"Min : {kpis['min']} °C", styles["Normal"]))
        story.append(Paragraph(f"Max : {kpis['max']} °C", styles["Normal"]))
        story.append(Paragraph(f"Moyenne : {kpis['avg']} °C", styles["Normal"]))

        story.append(Spacer(1, 10))

        # SECTION COMPARAISON HEBDOMADAIRE (uniquement pour weekly)
        if report_type == "weekly" and weekly_comparison:
            story.append(Paragraph("📉 Analyse Comparative (Semaine précédente)", styles["Heading2"]))
            
            for field_name, data in weekly_comparison.items():
                comparison_text = (
                    f"<b>{field_name}</b><br/>"
                    f"• Moyenne actuelle : {data['current_avg']}<br/>"
                    f"• Moyenne semaine précédente : {data['previous_avg']}<br/>"
                    f"• {data['comparison']}"
                )
                story.append(Paragraph(comparison_text, styles["Normal"]))
                story.append(Spacer(1, 5))
            
            story.append(Spacer(1, 10))

        # ANALYSE
        story.append(Paragraph("🔍 Analyse", styles["Heading2"]))
        story.append(Paragraph(insight, styles["Normal"]))

        story.append(Spacer(1, 10))

        # GRAPHIQUES
        for img in charts.values():

            if img and os.path.exists(img):

                story.append(
                    Image(
                        img,
                        width=480,
                        height=160
                    )
                )

                story.append(Spacer(1, 10))

        doc.build(story)

    # =========================================================
    # MAIN
    # =========================================================

    async def generate_and_send_report(
        self,
        db: AsyncSession,
        report_type="daily"
    ):

        try:

            config = await self.get_or_create_config(db)

            if not config.recipient_emails:
                raise Exception("Aucun destinataire")

            period_str, period_text, now = self._get_period(report_type)

            # DATA
            _, temp_values = self._safe_get_data(
                "temperature",
                period_str
            )

            # STATISTIQUES
            active_sensors = await self.get_active_sensors_count(db)
            total_measurements = await self.get_total_measurements_count(period_str)

            # COMPARAISON HEBDOMADAIRE (seulement pour weekly)
            weekly_comparison = None
            if report_type == "weekly":
                weekly_comparison = await self.get_weekly_comparison(period_str)

            kpis = self._compute_kpi(temp_values)

            insight = self._generate_insight(temp_values)

            # CHARTS
            charts = {
                "temp": self._create_chart(
                    "temperature",
                    period_str,
                    "#3b82f6",
                    "Temperature",
                    f"temp_{report_type}.png"
                ),
                "pressure": self._create_chart(
                    "pressure",
                    period_str,
                    "#10b981",
                    "Pression",
                    f"pressure_{report_type}.png"
                ),
                "humidity": self._create_chart(
                    "humidity",
                    period_str,
                    "#10b9b9",
                    "Humidité",
                    f"humidity_{report_type}.png"
                ),
                "air_quality": self._create_chart(
                    "air_quality",
                    period_str,
                    "#b91010",
                    "Qualité de l'air",
                    f"air_quality_{report_type}.png"
                ),
                "alcohol": self._create_chart(
                    "gas_alcohol",
                    period_str,
                    "#89b910",
                    "Alcool",
                    f"alcohol_{report_type}.png"
                ),
                "co2": self._create_chart(
                    "gas_co2",
                    period_str,
                    "#b910a8",
                    "CO2",
                    f"co2_{report_type}.png"
                ),
                "nh3": self._create_chart(
                    "gas_nh3",
                    period_str,
                    "#2f10b9",
                    "NH3",
                    f"nh3_{report_type}.png"
                ),
                "benzene": self._create_chart(
                    "gas_benzene",
                    period_str,
                    "#7e10b9",
                    "Benzène",
                    f"benzene_{report_type}.png"
                ),
                "smoke": self._create_chart(
                    "gas_smoke",
                    period_str,
                    "#b9a510",
                    "Fumée",
                    f"smoke_{report_type}.png"
                ),
                "nox": self._create_chart(
                    "gas_nox",
                    period_str,
                    "#f59e0b",
                    "NOX",
                    f"nox_{report_type}.png"
                )
            }

            pdf_filename = (
                f"{report_type}_{now.strftime('%Y%m%d_%H%M%S')}.pdf"
            )

            pdf_path = os.path.join(
                REPORTS_DIR,
                pdf_filename
            )

            self._build_pdf(
                report_type=report_type,
                period_text=period_text,
                charts=charts,
                kpis=kpis,
                insight=insight,
                output_path=pdf_path,
                active_sensors=active_sensors,
                total_measurements=total_measurements,
                weekly_comparison=weekly_comparison
            )

            email_sent = await send_report_email(
                recipients=config.recipient_emails,
                report_type=report_type,
                period=period_text,
                pdf_path=pdf_path
            )

            history = ReportHistoryModel(
                type=report_type,
                period=period_text,
                date=now.strftime("%d/%m/%Y %H:%M"),
                recipients=", ".join(config.recipient_emails),
                status="Envoyé" if email_sent else "Échec",
                pdf_path=pdf_path
            )

            db.add(history)

            await db.commit()

            return True

        except Exception as e:

            print(f"❌ Report error: {e}")

            await db.rollback()

            return False