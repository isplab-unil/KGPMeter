# -*- coding: utf-8 -*-
__author__ = "Didier Dupertuis, Kévin Huguenin"
__copyright__ = "Copyright 2019, The Information Security and Privacy Lab at the University of Lausanne (https://www.unil.ch/isplab/)"
__credits__ = ["Didier Dupertuis", "Kévin Huguenin", "Mathias Humbert"]

__version__ = "1"
__license__ = "MIT"
__maintainer__ = "Didier Dupertuis"
__email__ = "didier.dupertuis@unil.ch"

__project__ = "Data-less Kin Genomic Privacy Estimator"

from typing import List, Sequence as Seq

from pgmpy.factors.discrete import TabularCPD


class MendelianInheritanceCPD(TabularCPD):
    def __init__(self, maf: float, node: str, parents: Seq):
        """
        Creates the TabularCPD for a SNP node given its parents

        :param maf: the minor allele frequency of the considerde SNP
        :param node: the string id of the considered node
        :param parents: a list of ids of the parent(s) of the node, no parents in the tree implies an empty list
        :return:
        """
        assert (maf >= 0 and maf <= 0.5)
        states = ['AA', 'aA', 'aa']
        state_names = {node: states}
        # no parents case -> snp prior
        if (len(parents) == 0):
            super(MendelianInheritanceCPD, self).__init__(node, variable_card=3, values=[MendelianInheritanceCPD.prior(maf)],
                                                          state_names=state_names)
        # 2 parents case -> mendelian inheritance
        elif (len(parents) == 2):
            for parent in parents:
                state_names[parent] = states
            super(MendelianInheritanceCPD, self).__init__(node, variable_card=3, values=MendelianInheritanceCPD.both_parents(),
                                                          evidence=parents, evidence_card=[3, 3], state_names=state_names)
        else:
            raise ValueError("parents list is of length {}. It must have length 0 or 2. node: {}, parents: {}".format(len(parents), node, parents), parents)

    @staticmethod
    def prior(maf: float) -> List[float]:
        """
        Function giving SNP prior probabilities for any human, given a minor allele frequency (maf)
        """
        return [(1 - maf) ** 2, 2 * maf * (1 - maf), maf ** 2]

    @staticmethod
    def both_parents() -> List[List[float]]:
        return [
            [1, 0.5, 0, 0.5, 0.25, 0, 0, 0, 0],
            [0, 0.5, 1, 0.5, 0.5, 0.5, 1, 0.5, 0],
            [0, 0, 0, 0, 0.25, 0.5, 0, 0.5, 1]
        ]
