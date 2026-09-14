"""Remove expired attribution even when the service receives no traffic."""
import threading
import time


def post_worker_init(worker):
    def maintain():
        import attribution
        while True:
            try:
                with attribution.database():
                    pass
            except Exception:
                worker.log.warning('Attribution cleanup unavailable; inspect storage')
            time.sleep(3600)
    threading.Thread(target=maintain, daemon=True).start()
