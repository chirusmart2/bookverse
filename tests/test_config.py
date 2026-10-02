from app.config import normalize_database_url


def test_normalize_postgres_url_to_installed_driver():
    assert normalize_database_url("postgres://user:pass@db.example/books") == (
        "postgresql+psycopg2://user:pass@db.example/books"
    )
    assert normalize_database_url("postgresql://user:pass@db.example/books") == (
        "postgresql+psycopg2://user:pass@db.example/books"
    )
    assert normalize_database_url("postgresql+psycopg://user:pass@db.example/books") == (
        "postgresql+psycopg2://user:pass@db.example/books"
    )


def test_normalize_database_url_leaves_other_schemes_unchanged():
    assert normalize_database_url("sqlite:///bookverse.db") == "sqlite:///bookverse.db"
