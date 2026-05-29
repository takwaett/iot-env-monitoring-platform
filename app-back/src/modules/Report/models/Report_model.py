from sqlalchemy import Column, Integer, String, Boolean, DateTime, JSON, func
from src.utils.database import Base

class ReportConfigModel(Base):
    """
    Modèle stockant la configuration globale de planification des rapports.
    """
    __tablename__ = "report_configs"

    id = Column(Integer, primary_key=True, index=True)
    
    # État des switchs de planification
    daily_enabled = Column(Boolean, default=True, nullable=False)
    weekly_enabled = Column(Boolean, default=True, nullable=False)
    
    # Liste de diffusion stockée sous forme de tableau JSON
    recipient_emails = Column(JSON, default=list, nullable=False)
    
    # Configuration horaire pour les rapports
    daily_config = Column(JSON, default={"time": "08:00"}, nullable=False)
    weekly_config = Column(JSON, default={"time": "08:00", "day": "Lundi"}, nullable=False)
    
    # Date de dernière mise à jour
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())


class ReportHistoryModel(Base):
    """
    Modèle stockant l'historique de chaque rapport généré.
    """
    __tablename__ = "report_history"

    id = Column(Integer, primary_key=True, index=True)
    type = Column(String(50), nullable=False)
    period = Column(String(255), nullable=False)
    date = Column(String(50), nullable=False)
    recipients = Column(String(255), nullable=False)
    status = Column(String(50), default="Envoyé", nullable=False)
    pdf_path = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=func.now())