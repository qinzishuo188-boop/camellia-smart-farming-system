import sqlite3
from sqlmodel import Session, SQLModel, create_engine
from .config import get_settings

settings = get_settings()
connect_args = {"check_same_thread": False} if settings.database_url.startswith("sqlite") else {}
engine = create_engine(settings.database_url, echo=settings.debug, connect_args=connect_args)


def init_db() -> None:
    SQLModel.metadata.create_all(engine)


def get_session():
    with Session(engine) as session:
        yield session


def migrate_db() -> None:
    """Add new columns to existing tables for SQLite compatibility."""
    if not settings.database_url.startswith("sqlite"):
        return
    db_path = settings.database_url.replace("sqlite:///", "", 1).lstrip("./")
    if ":memory:" in db_path:
        return
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        migrations = [
            ("plots", "irrigation_type", "TEXT"),
            ("plots", "soil_ph", "REAL"),
            ("plots", "sensor_device_id", "TEXT"),
            ("growth_records", "data_source", "TEXT DEFAULT 'manual'"),
            ("farming_logs", "data_source", "TEXT DEFAULT 'manual'"),
            ("farming_logs", "execution_image_url", "TEXT"),
            ("farming_logs", "linked_decision_id", "INTEGER"),
            ("diagnosis_records", "data_source", "TEXT DEFAULT 'manual'"),
            ("decision_records", "data_source", "TEXT DEFAULT 'manual'"),
            ("decision_records", "confidence", "TEXT DEFAULT 'medium'"),
            ("decision_records", "review_status", "TEXT DEFAULT 'pending'"),
            ("decision_records", "reviewed_by", "INTEGER"),
            ("decision_records", "execution_status", "TEXT DEFAULT 'not_executed'"),
            ("decision_records", "execution_cost", "REAL DEFAULT 0"),
            ("decision_records", "execution_image_url", "TEXT"),
            ("warning_records", "data_source", "TEXT DEFAULT 'manual'"),
            ("warning_records", "trigger_condition", "TEXT"),
            ("decision_rules", "rule_version", "TEXT DEFAULT '1.0'"),
            ("decision_rules", "applicable_region", "TEXT"),
            ("decision_rules", "applicable_variety", "TEXT"),
            ("decision_rules", "requires_expert_review", "INTEGER DEFAULT 0"),
        ]

        for table, column, col_type in migrations:
            try:
                cursor.execute(f"ALTER TABLE {table} ADD COLUMN {column} {col_type}")
            except sqlite3.OperationalError:
                pass

        conn.commit()
        conn.close()
    except Exception:
        pass
