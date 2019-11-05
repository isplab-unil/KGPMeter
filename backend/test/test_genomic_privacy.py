# -*- coding: utf-8 -*-
__author__ = "Didier Dupertuis, Benjamin Trubert, Kévin Huguenin"
__copyright__ = "Copyright 2019, The Information Security and Privacy Lab at the University of Lausanne (https://www.unil.ch/isplab/)"
__credits__ = ["Didier Dupertuis", "Benjamin Trubert", "Kévin Huguenin", "Mathias Humbert"]

__version__ = "1"
__license__ = "MIT"
__maintainer__ = "Didier Dupertuis"
__email__ = "didier.dupertuis@unil.ch"

__project__ = "Data-less Kin Genomic Privacy Estimator"

import math

from config import config
import kin_genomic_privacy as kgp
from test.family_trees import *

FLOAT_EQUALITY_TOLERANCE = 10**(-6)

def test_compute_privacy_metrics():
    """
    Test that genomic_privacy.compute_privacy_metrics() computes the correct metrics for different trees and different mafs
    """

    reference_scores = [
        (-0.0, 0.0),
        (0.11926078796386719, 0.05917215347290039),
        (0.41357421875, 0.2008056640625),
        (0.6796875, 0.322265625),
        (0.875, 0.40625),
        (-0.0, 0.0),
        (0.25509567191652893, 0.08807086944580078),
        (0.7028620822246405, 0.292236328125),
        (1.0341634761230454, 0.45703125),
        (1.25, 0.5625),
        (-0.0, 0.0),
        (0.2007720043684661, 0.07373607158660889),
        (0.5984967826193262, 0.248016357421875),
        (0.9155723917309059, 0.39404296875),
        (1.132048827786958, 0.4921875),
        (-0.0, 0.0),
        (0.16843760270556846, 0.06685939733420791),
        (0.5396151834624108, 0.22891372771139054),
        (0.8557955007597599, 0.36926619414022854),
        (1.078762986273194, 0.4661458395809555),
        (-0.0, 0.0),
        (0.15639675333570904, 0.05830995204317255),
        (0.5085200044957093, 0.21087775633584396),
        (0.8081030264046671, 0.34969875150722485),
        (1.0149553664368747, 0.44557292491566214),
        (-0.0, 0.0),
        (0.13021857216381447, 0.050973579856319375),
        (0.44511950957032764, 0.18872585689290605),
        (0.7191087550738349, 0.31761305484408187),
        (0.9069256984220547, 0.4083358705790159)
    ]


    sft_mini_scores = [sft.compute_privacy_metrics(maf) for sft in sfts_mini for maf in config["ENGINE_MAFS_IMMEDIATE"]]
    sft_maxi_scores = [sft.compute_privacy_metrics(maf) for sft in sfts_maxi for maf in config["ENGINE_MAFS_IMMEDIATE"]]

    print("\n\nreference scores:")
    print(reference_scores)
    print("sft_mini scores:")
    print(sft_mini_scores)
    print("sft_maxi scores:")
    print(sft_maxi_scores)

    range_scores = range(0,len(sft_mini_scores))
    range_metrics= range(2)
    print("assert sft_mini_scores==reference_scores (does the minimal tree computes the correct values?)")
    assert(all(all(math.isclose(reference_scores[i][j], sft_mini_scores[i][j], rel_tol=1e-06, abs_tol=0.0001) for j in range_metrics) for i in range_scores))
    print("yes ;-)")
    print("assert sft_maxi_scores==reference_scores (does the minimized tree computes the correct values?)")
    assert(all(all(math.isclose(reference_scores[i][j], sft_maxi_scores[i][j], rel_tol=1e-06, abs_tol=0.0001) for j in range_metrics) for i in range_scores))
    print("yes ;-)")

    print("\ntest_compute_privacy_metrics() SUCCESS!")

if __name__ == '__main__':
    test_compute_privacy_metrics()