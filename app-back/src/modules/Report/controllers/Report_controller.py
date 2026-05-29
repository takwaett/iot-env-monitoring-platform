# src/modules/Report/controllers/Report_controller.py

from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import FileResponse

from sqlalchemy.ext.asyncio import AsyncSession

from typing import List

import os

from src.utils.database import get_db
from src.utils.dependencies import get_current_user

from src.modules.auth.models.user_model import UserModel

from src.modules.Report.dtos.Report_dto import (
    ReportConfigResponseDTO,
    ReportConfigUpdateDTO,
    ReportHistoryResponseDTO,
    ApiResponseDTO
)

from src.modules.Report.services.Report_service import ReportService

router = APIRouter(
    prefix="/reports",
    tags=["Reports"]
)

report_service = ReportService()


# =========================================================
# CONFIG
# =========================================================

@router.get("/config")
async def get_config(
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):

    config = await report_service.get_or_create_config(db)

    return {
        "id": config.id,
        "daily_enabled": config.daily_enabled,
        "weekly_enabled": config.weekly_enabled,
        "recipient_emails": config.recipient_emails or []
    }


@router.put("/config")
async def update_config(
    dto: ReportConfigUpdateDTO,
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):

    config = await report_service.update_config(db, dto)

    return {
        "status": "success",
        "message": "Configuration mise à jour",
        "data": {
            "id": config.id,
            "daily_enabled": config.daily_enabled,
            "weekly_enabled": config.weekly_enabled,
            "recipient_emails": config.recipient_emails
        }
    }


# =========================================================
# HISTORY
# =========================================================

@router.get("/history")
async def get_history(
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):

    history = await report_service.get_history(db)

    return [
        {
            "id": item.id,
            "type": item.type,
            "period": item.period,
            "date": item.date or item.created_at.strftime("%d/%m/%Y %H:%M"),
            "recipients": item.recipients,
            "status": item.status,
            "pdf_path": item.pdf_path
        }
        for item in history
    ]


# =========================================================
# GENERATE
# =========================================================

@router.post("/trigger-test")
async def trigger_test(
    type: str = Query("daily"),
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):

    if type not in ["daily", "weekly"]:
        raise HTTPException(
            status_code=400,
            detail="Type invalide"
        )

    success = await report_service.generate_and_send_report(
        db,
        report_type=type
    )

    if not success:
        raise HTTPException(
            status_code=500,
            detail="Erreur génération rapport"
        )

    return {
        "status": "success",
        "message": f"Rapport {type} généré avec succès"
    }


# =========================================================
# DOWNLOAD
# =========================================================

@router.get("/download/{report_id}")
async def download_report(
    report_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):

    report = await report_service.get_report_by_id(
        db,
        report_id
    )

    if not report:
        raise HTTPException(
            status_code=404,
            detail="Rapport introuvable"
        )

    if not report.pdf_path:
        raise HTTPException(
            status_code=404,
            detail="PDF introuvable"
        )

    if not os.path.exists(report.pdf_path):
        raise HTTPException(
            status_code=404,
            detail="Fichier supprimé"
        )

    filename = os.path.basename(report.pdf_path)

    return FileResponse(
        path=report.pdf_path,
        media_type="application/pdf",
        filename=filename
    )