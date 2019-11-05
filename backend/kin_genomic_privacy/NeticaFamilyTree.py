# -*- coding: utf-8 -*-
__author__ = "Didier Dupertuis, Benjamin Trubert, Kévin Huguenin"
__copyright__ = "Copyright 2019, The Information Security and Privacy Lab at the University of Lausanne (https://www.unil.ch/isplab/)"
__credits__ = ["Didier Dupertuis", "Benjamin Trubert", "Kévin Huguenin", "Mathias Humbert"]

__version__ = "1"
__license__ = "MIT"
__maintainer__ = "Didier Dupertuis"
__email__ = "didier.dupertuis@unil.ch"

__project__ = "Data-less Kin Genomic Privacy Estimator"


class NeticaFamilyTree:
    def __init__(self, maf, netica, env, net, nodes, target, sequenced_relatives):
        self.maf = maf
        self.netica = netica
        self.env = env
        self.net = net
        self.nodes = nodes
        self.target = target
        self.sequenced_relatives = sequenced_relatives

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.netica.closeenv(self.env)
