"""Logging configuration"""
import logging

FORMAT = (
    '%(asctime)s %(levelname)s %(module)s:%(filename)s:%(lineno)d Function: %(funcName)s Exception: %(exc_info)s %('
    'message)s')


def config(local: bool = False) -> logging.Logger:
    """
    Set up a file logger and a console logger
    :return: configured logger for the web server
    """
    logger = logging.getLogger('rm_web_app')
    logger.setLevel(logging.DEBUG)

    fh = logging.FileHandler('rm_web_app.log')
    fh.setLevel(logging.DEBUG if local else logging.WARN)
    fh.setFormatter(logging.Formatter(fmt=FORMAT))

    ch = logging.StreamHandler()
    ch.setLevel(logging.DEBUG if local else logging.ERROR)
    ch.setFormatter(logging.Formatter(fmt=FORMAT))

    logger.addHandler(fh)
    logger.addHandler(ch)
    return logger
