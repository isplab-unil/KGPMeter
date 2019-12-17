# -*- coding: utf-8 -*-
__author__ = "Didier Dupertuis, Benjamin Trubert, Kévin Huguenin"
__copyright__ = "Copyright 2019, The Information Security and Privacy Lab at the University of Lausanne (https://www.unil.ch/isplab/)"
__credits__ = ["Didier Dupertuis", "Benjamin Trubert", "Kévin Huguenin", "Mathias Humbert"]

__version__ = "1"
__license__ = "MIT"
__maintainer__ = "Didier Dupertuis"
__email__ = "didier.dupertuis@unil.ch"

__project__ = "Data-less Kin Genomic Privacy Estimator"


import argparse
import datetime
import sys
import time
from multiprocessing import Pool

import api
import kin_genomic_privacy as kgp
from config import config
import database as db


def _fetch(syn_queue, nb_entry = 2000):
    with db.connect_db(config["DATABASE_CONFIG"]) as db_connexion:
      result = db.get_null_privacy_metrics(db_connexion, nb_entry)
      if result:
        [syn_queue.append(record) for record in result]

def daemon_compute_and_save_privacy_metrics(tree: str, maf: float, value_id:int) -> Tuple[float,float,float,float]:
    """
    Computes privacy metrics from a serialized tree from the database.
    """
    unserialized_tree = kgp.SequencedFamilyTree.unserialize(tree)
    if len(unserialized_tree.inference_network.nodes()) > config["ENGINE_MAX_NODES"] and config["ENGINE_USE_CACHE"]:
        with db.connect_db(config["DATABASE_CONFIG"]) as db_connexion:
            db.update_privacy_metric(db_connexion, value_id, -1, -1, 0)
        return (maf, -1, -1, 0)
    res = (maf, -1, -1, 0)
    try:
        res2 = api.compute_and_save_privacy_metrics(unserialized_tree, maf, value_id)
        res = res2
    except Exception as e:
        print("\n\nerror for value_id %d tree (maf=%f):" % (value_id, maf))
        print(tree)
    finally:
        return res

if __name__ == '__main__':

    parser = argparse.ArgumentParser(
        description="Update 'value' table from database for the row with Null values.")

    parser.add_argument('-s', '--start', help='starting time with the format "HH:MM"', type=str, default="00:00")
    parser.add_argument('-e', '--end', help='ending time with the format "HH:MM"', type=str, default="23:59")
    parser.add_argument('-v', '--verbose', help='display information', action="store_true")
    parser.add_argument('-n', '--number-process', help='number of process for parallel processing', type=int, default=4)
    parser.add_argument('-r', '--rows-number', help='number of rows to retrieve at each step', type=int, default=10000)
    parser.add_argument('-p', '--pause', help='number of seconds to sleep between each SQL query ', type=int, default=2)

    args = parser.parse_args()

    # Set starting and ending time
    try:
        start = datetime.datetime.time(datetime.datetime.strptime(args.start, "%H:%M"))
        end = datetime.datetime.time(datetime.datetime.strptime(args.end, "%H:%M"))
    except Exception as e:
        if args.verbose:
            print("Time format error. Should be HH:MM\n{}".format(e), file=sys.stderr)
            print("Default time value selected.")
        start = datetime.datetime.time(datetime.datetime.strptime("00:00", "%H:%M"))
        end = datetime.datetime.time(datetime.datetime.strptime("23:59", "%H:%M"))

    # Set checking time function
    if args.verbose:
        print("Starting time: {}\nEnding Time: {}".format(start, end))
    if start < end:
        check_time = lambda t: start <= t and t < end
    else:
        check_time = lambda t: start <= t or t < end

    queue = []
    while True:
        current = datetime.datetime.time(datetime.datetime.now())
        if check_time(current):
            _fetch(queue, args.rows_number)
            if len(queue) == 0:
                print("No empty maf value.", end='\r')
            else:
                with Pool(args.number_process) as pool:
                    pool.starmap(api.daemon_compute_and_save_privacy_metrics, queue)
                queue = []
            time.sleep(args.pause)
        else:
            time.sleep(60)
