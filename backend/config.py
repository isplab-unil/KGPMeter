# -*- coding: utf-8 -*-
__author__ = "Didier Dupertuis, Benjamin Trubert, Kévin Huguenin"
__copyright__ = "Copyright 2019, The Information Security and Privacy Lab at the University of Lausanne (https://www.unil.ch/isplab/)"
__credits__ = ["Didier Dupertuis", "Benjamin Trubert", "Kévin Huguenin", "Mathias Humbert"]

__version__ = "1"
__license__ = "MIT"
__maintainer__ = "Didier Dupertuis"
__email__ = "didier.dupertuis@unil.ch"

__project__ = "Data-less Kin Genomic Privacy Estimator"

import os
import logging
import warnings
import json


CONFIG_DIR = os.path.dirname(os.path.realpath(__file__))
CONFIG_FILE = CONFIG_DIR + "/config.json"
DEFAULT_CONFIG_FILE = CONFIG_DIR + "/config_default.json"

config = None
if os.path.isfile(CONFIG_FILE) or not os.path.isfile(DEFAULT_CONFIG_FILE):
  with open(CONFIG_FILE) as cfile:
    config = json.load(cfile)
else:
  warnings.warn("No configuration file (config.json) found, loading default configuration file instead...")
  with open(DEFAULT_CONFIG_FILE) as cfile:
    config = json.load(cfile)

logging.basicConfig(level=logging.INFO)
config["LOGGER"] = logging.getLogger(config["LOGGER_NAME"])
