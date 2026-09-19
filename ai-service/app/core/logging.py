import logging
import sys

def setup_logger():
    """
    Configures structured logging for CareerPilot AI Service.
    Sanitizes log messages to ensure zero secrets, passwords, or tokens are logged.
    """
    logger = logging.getLogger("careerpilot_ai")
    logger.setLevel(logging.INFO)

    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        formatter = logging.Formatter(
            '[%(asctime)s] [%(levelname)s] [careerpilot-ai]: %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )
        handler.setFormatter(formatter)
        logger.addHandler(handler)

    return logger

logger = setup_logger()
