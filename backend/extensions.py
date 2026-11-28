
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate

# Shared database extension
db = SQLAlchemy()

# Database migration extension
migrate = Migrate()
