# -*- coding: utf-8 -*-
__author__ = "Didier Dupertuis, Benjamin Trubert, Kévin Huguenin"
__copyright__ = "Copyright 2019, The Information Security and Privacy Lab at the University of Lausanne (https://www.unil.ch/isplab/)"
__credits__ = ["Didier Dupertuis", "Benjamin Trubert", "Kévin Huguenin", "Mathias Humbert"]

__version__ = "1"
__license__ = "MIT"
__maintainer__ = "Didier Dupertuis"
__email__ = "didier.dupertuis@unil.ch"

__project__ = "Data-less Kin Genomic Privacy Estimator"

import logging



logging.basicConfig(level=logging.INFO)


class Config(object):
  DEBUG = True
  TESTING = True

  ENGINE_MAFS_IMMEDIATE = [0.0, 0.03125, 0.125, 0.25, 0.5]
  ENGINE_MAFS_ALL = [0.0, 0.03125, 0.0625, 0.09375, 0.125, 0.15625, 0.1875, 0.21875, 0.25, 0.28125, 0.3125, 0.34375, 0.375, 0.40625, 0.4375, 0.46875, 0.5]

  ENGINE_USE_CACHE = False

  ENGINE_ENABLE_JS_CACHE_SAVE_ENDPOINT = False

  ENGINE_DEFAULT_TIMEOUT = 10
  ENGINE_PARALLELIZE = True
  ENGINE_MAX_SEQUENCED_NODES = 12
  ENGINE_MAX_NODES = 40

  ENGINE_VERBOSE = True

  ALLOW_CROSS_ORIGIN = True
  DATABASE_CONFIG = {
    "user": "app",
    "password": "KGP_m3t3r",
    "host": "localhost",
    "database": "kgp_meter",
    "use_pure": True
  }

  LOGGER = logging.getLogger("KGP_METER")

  STATIC_FILES_FOLDER = None
  SERVE_STATIC_FILES_FROM = None
