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
from typing import List, Sequence as Seq

import numpy as np

ABSOLUTE_EQUALITY_TOLERANCE = 10 ** (-20)

# a is the minor allele and A is the major allele
AA = 0
aA = 1
Aa = 1
aa = 2
int2snp = {aa: 'aa', Aa: 'Aa', AA: 'AA'}
snp2int = {v: k for (k, v) in int2snp.items()}

# todo: constrained variant assert 1dim list, return scalar
def entropy(*prob_distrib, normalized:bool=False) -> np.ndarray:
    """
    Calculates entropy from given outcomes probability distribution.

    it has 1 difference with scipy.stats.entropy:
    - it is vectorized on last dim of ndarray
    arguments:
    *prob_distrib -- float numpy.ndarray or object collapsible to one,
    the outcome probabilities should be stored in its last dimension.
    e.g. if prob_distrib.shape=[3, 2, 3], prob_distrib[1, 2, :] gives
    the probability distribution for random variable [1,2]

    returns a ndarray with 1 dimension less containing the entropy of each RV
    """
    prob_distrib = np.asarray(prob_distrib)
    prob_distrib[prob_distrib == 0] = 1  # -> silently set entropy(p(x)=0) to 0 instead of nan as log(1) = 0
    lastdim = prob_distrib.ndim - 1
    denominator = np.log2(prob_distrib.shape[lastdim]) if normalized else 1
    return (-np.sum(prob_distrib * np.log2(prob_distrib), axis=lastdim) / denominator).squeeze()

