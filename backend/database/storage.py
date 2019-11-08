# -*- coding: utf-8 -*-
__author__ = "Didier Dupertuis, Benjamin Trubert, Kévin Huguenin"
__copyright__ = "Copyright 2019, The Information Security and Privacy Lab at the University of Lausanne (https://www.unil.ch/isplab/)"
__credits__ = ["Didier Dupertuis", "Benjamin Trubert",
               "Kévin Huguenin", "Mathias Humbert"]

__version__ = "1"
__license__ = "MIT"
__maintainer__ = "Didier Dupertuis"
__email__ = "didier.dupertuis@unil.ch"

__project__ = "Data-less Kin Genomic Privacy Estimator"

from contextlib import closing, contextmanager
import logging
import json
import sys
import traceback
from typing import Dict, List
from typing import Optional as Opt
from typing import Sequence as Seq
from typing import Tuple
import warnings

import mysql.connector

logger = logging.getLogger(__name__)

def connect_db(db_config):
    """Handles the connection to the database, returns None in case of error/missing configuration"""
    if db_config:
        logger
        try:
            db_connexion = closing(mysql.connector.connect(**db_config))
            return db_connexion
        except Exception as e:
            error_msg_header = "Error connecting to database, not using it. See stacktrace:\n%s" % (e,)
            error_traceback = traceback.format_exc()
            logger.warning(error_msg_header)
            logger.warning(error_traceback)
    else:
        logger.info("No databasse configuration given, returning empty context")

    @contextmanager
    def empty_context():
        logger.info("yielding empty database connexion context")
        yield None
    return empty_context()

def db_exceptions_graceful_handler(request_function):
    """Handles graceful database error handling

    Ensures an exception raised either by the database or by a function in storage.py
    doesn't crash the whole program, but only returns a None value.
    """
    def handle_db_exception_wrapper(*args, **kwargs):
        try:
            return request_function(*args, **kwargs)
        except Exception as e:
            error_msg_header = "A function in database package failed, see stacktrace:\n%s" % (e,)
            error_traceback = traceback.format_exc()
            logger.warning(error_msg_header)
            logger.warning(error_traceback)
    return handle_db_exception_wrapper

@db_exceptions_graceful_handler
def insert_new_request(db_connexion, tree_edges: Seq[Seq[str]], tree_sequenced_relatives: Seq[str], tree_target: str,
                       tree_signature: str, ip: str, user_id: str, user_agent: str, source: str, lng: str) -> Opt[int]:
    """Insert a new request in database

    :return Return the id corresponding to the new inserted request, None if the request could not be inserted
    """
    tree_nodes = [n for edge in tree_edges for n in edge]
    assert all(len(e) == 2 for e in tree_edges)
    assert tree_target in tree_nodes
    assert tree_target not in tree_sequenced_relatives
    assert all(n in tree_nodes for n in tree_sequenced_relatives)

    cursor = db_connexion.cursor(prepared=True)

    tree = json.dumps({
        "edges": tree_edges,
        "sequenced_relatives": tree_sequenced_relatives,
        "target": tree_target,
    })
    cursor.execute('INSERT IGNORE INTO user(user_id, user_agent, source) VALUES (%s,%s,%s)',
                   (user_id, user_agent, source))
    cursor.execute(
        'INSERT IGNORE INTO request(tree, number_sequenced, signature, user_id, IP, lng) VALUES (%s,%s, %s,%s,%s, %s)',
        (tree, len(tree_sequenced_relatives), tree_signature, user_id, ip, lng))
    request_id = cursor.getlastrowid()
    db_connexion.commit()

    return request_id

@db_exceptions_graceful_handler
def insert_new_tree(db_connexion, tree: str, signature: str, number_sequenced: int = None) -> Opt[int]:
    """Insert a new tree in database

    :param tree: the serialized tree: output of SequencedFamilyTree.serialize()
    :param signature: the signature of the minimized SequencedFamilyTree (SequencedFamilyTree.signature)
    :return Return the id corresponding to the newly inserted row in tree table, None if the tree could not be inserted
    """

    cursor = db_connexion.cursor(prepared=True)
    cursor.execute('INSERT IGNORE INTO tree(tree, signature, number_sequenced) VALUES (%s,%s,%s)',
                   (tree, signature, number_sequenced))
    db_connexion.commit()
    tree_id = cursor.getlastrowid()

    return tree_id


@db_exceptions_graceful_handler
def insert_null_privacy_metrics(db_connexion, request_id: int, mafs, tree_id: int = None) -> Dict[float, int]:
    """Insert privacy metrics for a tree

    :param request_id: id of the request at the origin of the tree
    :param privacy_metrics: a list of 3-tuples where each is of the
           form (maf, posterior_entropy, exp_error).
           The last 2 elements of each tuple might be None, when those
           must be computed by the daemon later.
    :return a dictionary with keys=maf, and values = corresponding row id in value table
    """
    values_id = dict()
    cursor = db_connexion.cursor(prepared=True)
    params = [(request_id, maf, tree_id) for maf in mafs]
    for param in params:
        cursor.execute('INSERT INTO value(request_id, maf, tree_id) VALUES (%s, %s, %s)', param)
        values_id[param[1]] = cursor.lastrowid
    db_connexion.commit()

    return values_id


@db_exceptions_graceful_handler
def check_cache(db_connexion, signature: str) -> Opt[bool]:
    """Checks if the given signature is in the cache"""
    cursor = db_connexion.cursor(prepared=True)
    cursor.execute('SELECT * FROM tree WHERE signature=%s', (signature,))
    cursor.fetchall()
    result = (cursor.rowcount > 0)
    return result


@db_exceptions_graceful_handler
def get_tree_privacy_metrics(db_connexion, signature: str) -> Opt[List[Tuple[float, float, float, float]]]:
    """Retrieves the privacy metrics for each maf for the given tree signature

    :param tree_signature: a string representing the tree unique signature
    :return: None if the tree signature is not in the db_connexion, otherwise
        a list of 4-tuples where each is of the form (maf, prior_entropy, posterior_entropy, exp_error)
    """
    cursor = db_connexion.cursor(prepared=True)
    cursor.execute(
        'SELECT DISTINCT maf, posterior_entropy, exp_error, computation_time FROM value LEFT JOIN request ON value.request_id=request.id WHERE signature=%s and posterior_entropy is not NULL',
        (signature,))
    result = []
    for maf, posterior_entropy, exp_error, computation_time in cursor.fetchall():
        if 0 <= exp_error <= 1 and 0 <= posterior_entropy <= 1.6:
            result.append(
                (maf, posterior_entropy, exp_error, computation_time))
    return result


@db_exceptions_graceful_handler
def update_privacy_metric(db_connexion, value_id: int, posterior_entropy: float, exp_error: float,
                          computation_time: float = -1) -> None:
    """Update the privacy metric of a maf/request_id (identified by the value_id) already added in the database

    :param value_id: the row id in the value table
    :param posterior_entropy: calculated posterior entropy for given row
    :param exp_error: calculated expected error for given row
    :return:
    """
    cursor = db_connexion.cursor(prepared=True)
    cursor.execute('UPDATE value SET posterior_entropy=%s, exp_error=%s, computation_time=%s WHERE id=%s',
                   (posterior_entropy, exp_error, computation_time, value_id))
    db_connexion.commit()


@db_exceptions_graceful_handler
def get_null_privacy_metrics(db_connexion, nb_entries: int) -> Opt[List[Tuple[str, float, int]]]:
    """Select entries from table value where the privacy metrics are None

    :param nb_entry: number of maximum return entries
    :return: None if there are no privacy metrics to calculate, otherwise a list of tuple of the form (serialized tree, maf, value id)
    """
    cursor = db_connexion.cursor(prepared=True)
    cursor.execute(
        'SELECT tree.tree, maf, value.id FROM value JOIN request ON value.request_id=request.id JOIN tree ON request.signature=tree.signature WHERE posterior_entropy is NULL ORDER BY POSITION("1" IN REVERSE(BIN(ROUND(POW(2, 12)*maf)))) DESC, updated_at ASC LIMIT %s',
        (nb_entries,))
    results = cursor.fetchall()
    if cursor.rowcount > 0:
        return [row for row in results]
