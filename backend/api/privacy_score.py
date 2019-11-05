# -*- coding: utf-8 -*-
__author__ = "Didier Dupertuis, Benjamin Trubert, Kévin Huguenin"
__copyright__ = "Copyright 2019, The Information Security and Privacy Lab at the University of Lausanne (https://www.unil.ch/isplab/)"
__credits__ = ["Didier Dupertuis", "Benjamin Trubert", "Kévin Huguenin", "Mathias Humbert"]

__version__ = "1"
__license__ = "MIT"
__maintainer__ = "Didier Dupertuis"
__email__ = "didier.dupertuis@unil.ch"

__project__ = "Data-less Kin Genomic Privacy Estimator"

from contextlib import contextmanager
import hashlib
import math
from multiprocessing import Pool
import os
from random import randint
import sys
import time
import traceback
import warnings

import numpy as np
from flask import request, jsonify, Response

from config import config
import database as db
import kin_genomic_privacy as kgp
from .kgp_response import KgpResponse, KgpSuccess, KgpError
from .compute_and_save import compute_and_save_privacy_metrics_with_timeout, compute_and_save_privacy_metrics

LIST_SNP_FILE = os.path.dirname(os.path.realpath(__file__)) + "/list_snp_v4.txt"
try:
    with open(LIST_SNP_FILE) as f:
        LIST_SNP = [x for x in f.readlines()]
except Exception:
    LIST_SNP = None
    warnings.warn("Loading of SNP MAFs' distribution from file '"+LIST_SNP_FILE+"' didn't work, using constant MAFs' distribution.")


def privacy_score() -> KgpResponse:
    """
    Flask request handler to calculate a privacy score given a POST request on /privacy-score.
    :return: the response to be sent back to the user
    """
    parameters = None
    timestamp_js = None
    family_tree = None

    try:

        execution_time = time.time()
        parameters = request.get_json(force=True)

        timestamp_js = parameters["timestamp_js"]
        assert(isinstance(timestamp_js, int))

        if (config["ENGINE_VERBOSE"]):
            config["LOGGER"].info("\n\nprivacy-score request parameters:")
            config["LOGGER"].info(parameters)

        # needed for Netica: strings must be free of special characters, might be improved (@ comes from GEDCOM files)
        byte_readify = lambda s: s.replace("@","X")

        # BayesianModel want edges as tuples, not lists, + byte_readify() for netica
        tree_edges = [(byte_readify(edge[0]), byte_readify(edge[1])) for edge in parameters["family_tree"]["edges"]]
        tree_sequenced_relatives= [byte_readify(sr) for sr in parameters["family_tree"]["sequenced_relatives"]]
        tree_target = byte_readify(parameters["family_tree"]["target"])
        # Family nodes have F or f in their id
        family_nodes = [byte_readify(node) for edge in tree_edges for node in edge if
                        "F" in node or "f" in node]

        # if no target or target not in tree -> return error
        if(all([tree_target not in edge for edge in tree_edges])):
            return KgpError(timestamp_js, "before instanciation", code=4, allow_cross_origin=config["ALLOW_CROSS_ORIGIN"])

        # Create the SequencedFamilyTree
        family_tree = kgp.SequencedFamilyTree(tree_edges,
                                          tree_sequenced_relatives,
                                          tree_target,
                                          family_nodes)
        
        if (config["ENGINE_VERBOSE"]):
            config["LOGGER"].info("Number of nodes in minimized tree: "+str(len(family_tree.inference_network.nodes())))
            config["LOGGER"].info("Number of sequenced nodes in minimized tree: "+str(len(family_tree.sequenced_relatives())))


        db_config = config["DATABASE_CONFIG"] if config["ENGINE_USE_CACHE"] else None
        with db.connect_db(db_config, config["LOGGER"]) as db_connexion:

            if (config["ENGINE_VERBOSE"]):
                if not config["ENGINE_USE_CACHE"]:
                    config["LOGGER"].info("Cache not used in this session")
                elif db_connexion:
                    config["LOGGER"].info("Successful connexion to database")
                else:
                    config["LOGGER"].warning('Connexion to database failed with config["ENGINE_USE_CACHE"]=True. Continuing without db.')

            # insert the request in database
            if db_connexion:
                request_id = db.insert_new_request(
                    db_connexion,
                    tree_edges,
                    tree_sequenced_relatives,
                    tree_target,
                    family_tree.signature,
                    request.remote_addr,
                    hashlib.md5(parameters["user"]["id"].encode('ascii')).hexdigest(),  # hash user-id
                    request.headers.get('User-Agent'),
                    parameters["user"]["source"],
                    parameters["user"]["lng"]
                )

            # get privacy metrics from cache
            privacy_metrics = None
            tree_id = None
            if db_connexion:
                if db.check_cache(db_connexion, family_tree.signature):
                    privacy_metrics = db.get_tree_privacy_metrics(db_connexion, family_tree.signature)
                else:
                    tree_id = db.insert_new_tree(db_connexion, family_tree.serialize(), family_tree.signature,len(family_tree.sequenced_relatives()))


            if (config["ENGINE_VERBOSE"]):
                if db_connexion:
                    config["LOGGER"].info("privacy_metrics from database:")
                    config["LOGGER"].info(privacy_metrics)


            # Check that there are at least 2 values in cache
            calculated_mafs = []
            score_in_cache = False
            if privacy_metrics:
                calculated_mafs = [x[0] for x in privacy_metrics]
                min_two_values_in_cache =  0.5 in calculated_mafs and 0.25 in calculated_mafs
                score_in_cache = min_two_values_in_cache
            else:
                privacy_metrics=[]
            if (config["ENGINE_VERBOSE"]):
                config["LOGGER"].info("score_in_cache="+str(score_in_cache)+", calculated_mafs="+str(calculated_mafs))

            # if score not in cache -> insert empty scores
            values_id = dict()
            if db_connexion and not score_in_cache:
                values_id = db.insert_null_privacy_metrics(db_connexion, request_id, config["ENGINE_MAFS_ALL"], tree_id)
            if not values_id:
                values_id = dict()
            # if too many sequenced nodes in minimized tree -> return error
            if(len(family_tree.sequenced_relatives())> config["ENGINE_MAX_SEQUENCED_NODES"]):
                return KgpError(timestamp_js, family_tree.signature, code=3, allow_cross_origin=config["ALLOW_CROSS_ORIGIN"])

            # if too many nodes in minimized tree -> return error
            if(len(family_tree.inference_network.nodes())>config["ENGINE_MAX_NODES"]):
                return KgpError(timestamp_js, family_tree.signature, code=7, allow_cross_origin=config["ALLOW_CROSS_ORIGIN"])

            # calculate
            if not score_in_cache:
                mafs = [maf for maf in config["ENGINE_MAFS_IMMEDIATE"] if maf not in calculated_mafs]
                # parallelize
                if config["ENGINE_PARALLELIZE"]:
                    with Pool(4) as pool:
                        privacy_metrics = privacy_metrics +\
                                          pool.starmap(compute_and_save_privacy_metrics_with_timeout,
                                                       [(family_tree, maf, values_id.get(maf),
                                                         config["ENGINE_DEFAULT_TIMEOUT"]) for maf in
                                                        mafs])
                # non-parallel version
                else:
                    privacy_metrics = privacy_metrics + [
                        compute_and_save_privacy_metrics(family_tree.copy(), maf, values_id.get(maf)) for maf in mafs]

            # timeout is handled separately in each thread -> if None in any of the result, there was a timeout...
            computation_not_finished = any([None in pm for pm in privacy_metrics])
            if computation_not_finished:
                return KgpError(timestamp_js, family_tree.signature, code=1, allow_cross_origin=config["ALLOW_CROSS_ORIGIN"])

            sft_cache = {maf: (mean_entropy_posterior, mee) for maf, mean_entropy_posterior, mee, ct in privacy_metrics}
            family_tree.cache = sft_cache
            privacy_score = family_tree.snps_privacy_score([pm[0] for pm in privacy_metrics], LIST_SNP)

            # calculate & format execution time
            execution_time = time.time() - execution_time
            if (config["ENGINE_VERBOSE"]):
                config["LOGGER"].info("whole execution time=" + str(execution_time))

            if(math.isnan(privacy_score) or math.isinf(privacy_score) or privacy_score<0):
              raise Exception("privacy_score is NaN, Inf or negative: not a valid result.")

            return KgpSuccess(
                timestamp_js,
                family_tree.signature,
                privacy_score,
                score_in_cache,
                execution_time,
                allow_cross_origin=config["ALLOW_CROSS_ORIGIN"]
            )
    except Exception:
        error_identifier = randint(0,10**9)
        config["LOGGER"].error("\n\nERROR in privacy_score(), error code %d" % error_identifier)
        config["LOGGER"].error(traceback.format_exc())
        config["LOGGER"].error("\n\nrequest parameters leading to error:")
        config["LOGGER"].error(parameters if parameters else "before instanciation")
        return KgpError(
            timestamp_js if timestamp_js else "before instanciation",
            family_tree.signature if family_tree else "before instanciation",
            code=2,
            extras={"error_identifier": error_identifier},
            allow_cross_origin=config["ALLOW_CROSS_ORIGIN"]
        )
