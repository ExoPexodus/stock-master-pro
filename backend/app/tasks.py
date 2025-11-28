from celery import Celery
from app.config import Config
from app.utils.import_processor import process_file_sync

celery = Celery('tasks', broker=Config.CELERY_BROKER_URL, backend=Config.CELERY_RESULT_BACKEND)

@celery.task
def process_import_file(filepath, job_id):
    """Process large files asynchronously"""
    return process_file_sync(filepath, job_id)
