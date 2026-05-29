from sqlalchemy import Column, Float, ForeignKey, Integer, String, DateTime
from sqlalchemy.orm import relationship 
from datetime import datetime           
from src.utils.database import Base
from .controllers.measurement_controller import router as measurement_router
#orm(oriented relationnal mapping)
#integer:entier