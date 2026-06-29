import logging

logger = logging.getLogger(__name__)


def notify_officers(transaction_id: int):

    logger.warning(
        f"FRAUD ALERT -> Transaction {transaction_id}"
    )

    return True
