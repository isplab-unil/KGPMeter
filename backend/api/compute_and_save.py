# -*- coding: utf-8 -*-
__author__ = "Didier Dupertuis, Benjamin Trubert, Kévin Huguenin"
__copyright__ = "Copyright 2019, The Information Security and Privacy Lab at the University of Lausanne (https://www.unil.ch/isplab/)"
__credits__ = ["Didier Dupertuis", "Benjamin Trubert", "Kévin Huguenin", "Mathias Humbert"]

__version__ = "1"
__license__ = "MIT"
__maintainer__ = "Didier Dupertuis"
__email__ = "didier.dupertuis@unil.ch"

__project__ = "Data-less Kin Genomic Privacy Estimator"

import signal
import time
from typing import Tuple, Optional as Opt

from flask import current_app

from kin_genomic_privacy import SequencedFamilyTree
import database as db



# TODO: add asserts, do it everywhere
def compute_and_save_privacy_metrics(family_tree:SequencedFamilyTree, maf:float, value_id:int) -> Tuple[float,float,float,float]:
    """Computes the privacy metric and inserts the result in database.

    :param family_tree: a SequencedFamilyTree
    :param maf: a maf
    :param value_id: a value id corresponding to a row in table "value"
    :return: a 4 tuple of the form: (maf, mean_entropy_posterior, mean_exp_error, computation_time)
    """

    computation_time = time.process_time()
    mean_entropy_posterior, mean_exp_error= family_tree.compute_privacy_metrics(maf)
    computation_time = time.process_time() - computation_time

    # # insert result in database:
    if current_app.config["ENGINE_USE_CACHE"] and value_id:
        with db.connect_db(current_app.config["DATABASE_CONFIG"]) as db_connexion:
            db.update_privacy_metric(db_connexion, value_id, mean_entropy_posterior, mean_exp_error, computation_time)

    return (maf, mean_entropy_posterior, mean_exp_error, computation_time)


def handler(signum, frame):
    raise TimeoutError("end of time")

def compute_and_save_privacy_metrics_with_timeout(family_tree:SequencedFamilyTree, maf:float, value_id:int, timeout:int=10) -> Tuple[float,Opt[float],Opt[float],float]:
    """Wraps compute_privacy_metrics() with a timer using signal module returns (maf, None, None) on timeout"""


    signal.signal(signal.SIGALRM, handler)
    signal.alarm(timeout)
    try:
        result = compute_and_save_privacy_metrics(family_tree, maf, value_id)
    except TimeoutError:
        result = (maf, None, None,timeout)
    signal.alarm(0)
    return result


