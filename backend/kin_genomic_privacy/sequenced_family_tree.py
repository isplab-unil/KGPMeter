# -*- coding: utf-8 -*-

__author__ = "Didier Dupertuis, Benjamin Trubert, Kévin Huguenin"
__copyright__ = "Copyright 2019, The Information Security and Privacy Lab at the University of Lausanne (https://www.unil.ch/isplab/)"
__credits__ = ["Didier Dupertuis", "Benjamin Trubert", "Kévin Huguenin", "Mathias Humbert"]

__version__ = "1"
__license__ = "MIT"
__maintainer__ = "Didier Dupertuis"
__email__ = "didier.dupertuis@unil.ch"

__project__ = "Data-less Kin Genomic Privacy Estimator"

from collections.abc import MutableMapping, Hashable
import hashlib
import json
import logging
import math
import random
from copy import deepcopy
import time
from typing import List, Tuple, Union
import warnings

import networkx as nx
import numpy as np
from pgmpy.models import BayesianModel

from neticaPy import Netica
from .genomic_privacy import entropy, ABSOLUTE_EQUALITY_TOLERANCE, snp2int
from .MendelianInheritanceCPD import MendelianInheritanceCPD
from .NeticaFamilyTree import NeticaFamilyTree

logging.getLogger("neticaPy.netica").setLevel(logging.WARNING)

class SequencedFamilyTree(BayesianModel, Hashable):

    relation_map = {
        # great grand parent generation
        'great grandparent':{
            'predecessor': 'other',
            'successor': 'grand uncle/aunt'}
        ,
        # Grand parent generation
        'grand uncle/aunt':
            {"predecessor": "other",
             'successor': "cousin once-removed",  # once removed = same generation as parent
             },

        'grandparent': {
            'predecessor': 'great grandparent',
            'successor': 'uncle/aunt'
        },
        # parent generation
        'parent': {
            'predecessor': 'grandparent',
            'successor': 'sibling'
        },
        'uncle/aunt': {
            'predecessor': 'other',
            'successor': 'cousin'
        },
        'cousin once-removed':{
            "predecessor": "other",
            'successor': "second cousin"
        },

        'uncle-/aunt-in-law': {
            'predecessor': 'other',
            'successor': 'other'
        },

        # generation you
        'you': {
            "predecessor": "parent",
            'successor': "child",
        },
        'partner': {
            "predecessor": "other",
            'successor': "other",
        },
        'sibling': {
            'predecessor': 'other',
            'successor': 'nephew/niece' # also niblings
        },
        'sibling-in-law': {
            'predecessor': 'other',
            'successor': 'nephew/niece'
        },
        'cousin': {
            'predecessor': 'uncle-/aunt-in-law',
            'successor': 'other'
        },
        'second cousin':
            {"predecessor": "other",
             'successor': "other"},

        # generation child
        'child': {
            'predecessor': 'partner',
            'successor': 'grandchild'
        },
        'child-in-law': {
            'predecessor': 'partner',
            'successor': 'grandchild'
        },
        'nephew/niece': {
            'predecessor': 'sibling-in-law',
            'successor': 'grand nephew/niece'
        },
        # generation grand child
        'grand nephew/niece': {
            'predecessor': 'other',
            'successor': 'great grand nephew/niece'
        },
            'great grand nephew/niece':{
                'predecessor': 'other',
                'successor': 'other'
            },
        'grandchild':
            {'predecessor': 'child-in-law',
             'successor': 'great grandchild'
             },
        # generation great grand child
        'great grandchild':{
            'predecessor':'other',
            'successor':'other'
            },
        # other
        'other':
            {'predecessor': 'other',
             'successor': 'other'}
    }
    _cache = {}

    def __init__(self, family_tree_edges: list, sequenced_relatives: list, target: str, family_nodes: list, minimize:bool=True, logger:logging.Logger=None, cache=None):
        """
        Represents a Family Tree containing sequenced members and the target of an inference attack

        Minimizes the tree in the sense that it keeps only family members relevant
        to inferring the target's SNPs.
        Family nodes are needed in the constructor to build a unique signature for the
        family tree. They are removed later on for inference.
        :param family_tree_edges: a list of 2-tuples, each of which is an edge [from, to] in the
            family tree, including family nodes.
        :param sequenced_relatives: list of the nodes that are sequenced
        :param target: the family member whose SNPs one wants to infer.
        :param family_nodes: list of the nodes who are family nodes.
        :param minimize: whether minimization needs to be performed on this tree.
               Used by SequencedFamilyTree.unserialize()
        """
        super(SequencedFamilyTree, self).__init__(deepcopy(family_tree_edges))
        # create Bayesian network
        self._inference_network = False
        # check requirements
        if (len(family_tree_edges) == 0):
            self._add_node(target)
        assert all(n!="" for n in self.nodes())
        assert (target in self.nodes())
        assert (target not in sequenced_relatives)
        for n in sequenced_relatives: assert (n in self.nodes())
        for n in family_nodes: assert (n in self.nodes())
        # TODO: assert that the list of edges indeed describes a family tree: F node: pred <= 2, I node: pred <= 1, succ <=1, NO CYCLES

        self.target = target
        # flag sequenced and family nodes with networkx properly
        for n in self.nodes():
            self.set_sequenced(n, n in sequenced_relatives)

        for n in self.nodes():
            self.set_family_node(n, n in family_nodes)

        # remove useless nodes and add back missing parents
        if minimize:
            added_parents = self._add_missing_parents()
            if logger: logger.log("Missing parents added upon start: %s", str(added_parents))
            removed_nodes = self._remove_target_independant_nodes()
            if logger: logger.log("Nodes removed because independant from target: %s", str(removed_nodes))
            removed_nodes = self._remove_non_sequenced_leaf_nodes()
            if logger: logger.log("Nodes removed because non-sequenced leaves: %s", str(removed_nodes))
            # add missing parents, so that everybody has 2 parents
            added_parents = self._add_missing_parents()
            if logger: logger.log("Missing parents added to ensure everybody has 2 parents: %s", str(added_parents))

        # create signature
        self.signature = hashlib.md5(self._signature(self.target).encode('ascii')).hexdigest()

        if self.signature not in SequencedFamilyTree._cache:
            SequencedFamilyTree._cache[self.signature] = {}
        if cache:
            SequencedFamilyTree._cache[self.signature] = {**SequencedFamilyTree._cache[self.signature], **cache}


    @staticmethod
    def unserialize(serialized_SequencedFamilyTree: str, **kwargs):
        """Re-builds a SequencedFamilyTree from the output of serialize()"""
        serialization = json.loads(serialized_SequencedFamilyTree)
        if 'family_tree_edges' in serialization.keys():
            edges = serialization['family_tree_edges']
        else:
            edges = serialization['edges']
        if  'family_nodes' not in serialization :
          family_node = list(set(n for e in edges for n in e if "F" in n))
        else:
          family_node = serialization["family_nodes"]

        return SequencedFamilyTree(
            edges,
            serialization["sequenced_relatives"],
            serialization["target"],
            family_node,
            **kwargs
        )

    def serialize(self) -> str:
        """
        Serializes the tree to a json object in a string
        Note: there is no guarantee of uniqueness of serialization across 2 equivalent SequencedFamilyTree.
        For a unique signature, use SequencedFamilyTree.signature
        :return: a string faithfully representing the minimal tree of this SequencedFamilyTree.
        """
        serialization = {
            "family_tree_edges": self.edges(),
            "sequenced_relatives": self.sequenced_relatives(),
            "target": self.target,
            "family_nodes": self.family_nodes()
        }
        return json.dumps(serialization)

    @property
    def cache(self):
        return SequencedFamilyTree._cache[self.signature]

    @cache.setter
    def cache(self, value):
        assert(isinstance(value, MutableMapping))
        SequencedFamilyTree._cache[self.signature] = value

    @property
    def inference_network(self):
        if not self._inference_network:
            self._inference_network = self._create_inference_network()
        return self._inference_network

    @inference_network.setter
    def inference_network(self, value):
        warnings.warn("SequencedFamilyTree.inference_network setter: non-mutable parameter, new value ignored")

    # TODO: convert attribute name strings as constant strings
    def is_sequenced(self, node) -> bool:
        assert node in self.nodes()
        return nx.get_node_attributes(self, "sequencedDNA")[node]

    def set_sequenced(self, node, sequencedDNA) -> None:
        assert node in self.nodes() and (not self.is_family_node(node) or not sequencedDNA)
        nx.set_node_attributes(self, values={node: sequencedDNA}, name="sequencedDNA")

    def sequenced_relatives(self) -> List[str]:
        return [n for n, seq in nx.get_node_attributes(self, "sequencedDNA").items() if seq]

    def is_family_node(self, node) -> bool:
        assert node in self.nodes()
        return nx.get_node_attributes(self, "family_node").get(node)

    def set_family_node(self, node, is_family_node) -> None:
        assert node in self.nodes()
        nx.set_node_attributes(self, values={node: is_family_node}, name="family_node")

    def family_nodes(self) -> List[str]:
        return [n for n, seq in nx.get_node_attributes(self, "family_node").items() if seq]

    def generate_new_node_id(self):
        return max(list(self.nodes()), key=len)+"n"

    def _add_node(self, node, weight=None, sequencedDNA=False, family_node=False):
        """Adds a node to the SequencedFamilyTree with its proper sequencedDNA and family_node attributes

        internal method, a family tree should be immutable once created"""
        super(SequencedFamilyTree, self).add_node(node, weight)
        self.set_sequenced(node, sequencedDNA)
        self.set_family_node(node, family_node)

    def _create_inference_network(self) -> BayesianModel:
        bayesian_network = BayesianModel(self.edges())
        bayesian_network.add_node(self.target)
        for fn in self.family_nodes():
            if len(bayesian_network.successors(fn))==0:
                bayesian_network.add_edge(fn,self.generate_new_node_id())
            bayesian_network.add_edges_from([(pred, succ) for pred in bayesian_network.predecessors(fn) for succ in bayesian_network.successors(fn)])
            bayesian_network.remove_node(fn)
        return bayesian_network

    def _remove_target_independant_nodes(self):
        """
        Remove all nodes that are independent from target given sequenced nodes
        """
        bayes_net = self.inference_network
        nodes_to_remove = set()
        sequenced_relatives = self.sequenced_relatives()
        for node in bayes_net.nodes():
            if not bayes_net.is_active_trail(node, self.target, [n for n in sequenced_relatives if n != node]):
                nodes_to_remove.add(node)

        for node in nodes_to_remove:
            self.remove_node(node)
        return nodes_to_remove

    def _remove_non_sequenced_leaf_nodes(self):
        """
        Removes all non-sequenced leaf nodes: nodes that aren't between a sequenced node and the target.
        """
        sequenced_relatives = self.sequenced_relatives()
        nodes_to_keep = set(sequenced_relatives)
        nodes_to_keep.add(self.target)
        undirected_self = self.to_undirected()
        for sn in sequenced_relatives:
            # all_simple paths returns a generator of lists -> call next() to get the first one
            # (there is only one path as, at this point, the SequencedFamilyTree is a graph theory tree too)
            sp = next(nx.all_simple_paths(undirected_self, sn, self.target))
            nodes_to_keep.update(sp)
        nodes_to_remove = set([n for n in list(self.nodes()) if n not in nodes_to_keep])

        for n in nodes_to_remove:
            self.remove_node(n)
        return nodes_to_remove

    def _add_missing_parents(self):
        """
        Ensures that every node has either 0 or 2 parents.

        Some parents might be missing at initialization or have been removed during minimization.
        """
        added_parents = []
        for fn in self.family_nodes():
            for i in range(2 - len(list(self.predecessors(fn)))):
                new_parent = self.generate_new_node_id()
                added_parents.append((new_parent, fn))
                self._add_node(new_parent)
                self.add_edge(new_parent, fn)
        return added_parents

    def _signature(self, root, origin=None):
        """Recursive function creating a unique signature corresponding to this SequencedFamilyTree.

        :return: a string uniquely representing this tree
        """
        preds = sorted([self._signature(n, root) for n in self.predecessors(root) if origin is None or n != origin])
        succs = sorted([self._signature(n, root) for n in self.successors(root) if origin is None or n != origin])
        seq = self.is_sequenced(root)
        # bm.nodes[root]["sequencedDNA"] if "sequencedDNA" in bm.nodes[root] else ""
        return 'N(%s|%s|%s)' % (str(seq), ','.join(preds), ','.join(succs))

    def __hash__(self):
        return self.signature

    def copy(self):
        return deepcopy(self)

    def to_netica_net(self, maf):

        #TODO : ASCIIFY PROPERLY: REPRESENT THEM IN HEXADECIMAL/base 64
        def bytify(str):
            return bytes(str.replace("@", "X"), "utf-8")

        # todo in MendelianInheritanceCPD
        mendelian_inheritance = [
            [[1.0, 0.0, 0.0],
             [0.5, 0.5, 0.0],
             [0.0, 1.0, 0.0]],
            [[0.5, 0.5, 0.0],
             [0.25, 0.5, 0.25],
             [0.0, 0.5, 0.5]],
            [[0.0, 1.0, 0.0],
             [0.0, 0.5, 0.5],
             [0.0, 0.0, 1.0]]
        ]

        # create netica obj, env and net
        netica = Netica()
        env = netica.newenv()
        res = netica.initenv(env)
        net = netica.newnet(b"GenomicPrivacy", env)

        # create the nodes, links & CPTs
        # nodes = {node:netica.newnode(bytes(node.replace("@",""), encoding), 3, net) for node in self.bayesian_network.nodes()}
        nodes = {node: netica.newnode(bytify(node), 3, net) for node in self.inference_network.nodes()}
        for node, netica_node in nodes.items():
            # todo calculate b"AA, Aa, aa"
            netica.setnodestatenames(netica_node, b"AA, Aa, aa")
            parents = self.inference_network.predecessors(node)
            # no parents
            if len(parents) == 0:
                netica.setnodeprobs(netica_node, [], MendelianInheritanceCPD.prior(maf))
            # parents
            elif len(parents) == 2:
                p0 = nodes[parents[0]]
                p1 = nodes[parents[1]]
                netica.addlink(p0, netica_node)
                netica.addlink(p1, netica_node)
                # CPT
                for i0 in range(0, 3):
                    for i1 in range(0, 3):
                        netica.setnodeprobs(netica_node, [i0, i1], mendelian_inheritance[i0][i1])

        netica.compilenet(net)

        # move node extration in NeticaFamilyTree.__init__()
        return NeticaFamilyTree(
            maf,
            netica,
            env,
            net,
            nodes,
            nodes[self.target],
            [nodes[sr] for sr in self.sequenced_relatives()]
        )

    def compute_privacy_metrics(self, maf: float, detailed_results: bool = False) -> Union[Tuple[float, float], List[dict]]:
        """Computes the privacy metrics for a given family tree and maf

        :param maf: a minor allele frequency for which the calculation is to be done
        :param detailed_results: whether to return detailed results, see return
        :return: If detailed_results=False, a 2-tuple of the form (mean posterior entropy, mean expected error),
                if detailed_results=True, it returns a list of dict (1 dict per configuration of the sequenced relatives) of the form:
                {
                    "evidence": dict,
                    "p_evidence": float,
                    "target_distrib": List[float],
                    "entropy_posterior": float,
                    "exp_error": float
                }
        """

        with self.to_netica_net(maf) as netica_net:
            result = []  # list used only for detailed results
            evidence = {}  # dict to contain observed evidence in each case
            # using lists for reference
            mean_entropy_posterior = [0]  # only used for undetailed resutls
            mean_exp_error = [0]  # only used for undetailed resutls

            # no sequenced relatives or maf is zero-> return prior with probability 1...
            if len(netica_net.sequenced_relatives) == 0 or abs(maf) <= ABSOLUTE_EQUALITY_TOLERANCE:
                prior_distrib = MendelianInheritanceCPD.prior(maf)
                entropy_prior = entropy(prior_distrib).item()
                error_prior = np.sum(np.array(prior_distrib * (1 - (np.array(prior_distrib))))).item()
                if detailed_results:
                    return [{
                        "evidence": [],
                        "p_evidence": 1,
                        "target_distrib": prior_distrib,
                        "entropy_posterior": entropy_prior,
                        "exp_error": error_prior
                    }]
                else:
                    return entropy_prior, error_prior

            def compute_privacy_metrics_recursively(sequenced_relatives, p_inputs):
                # termination condition 1 : probability of inputs is zero.
                p_inputs_zero = math.isclose(np.sum(p_inputs), 0.0, abs_tol=ABSOLUTE_EQUALITY_TOLERANCE)
                if p_inputs_zero:
                    # return an dummy result
                    if detailed_results:
                        result.append({
                            "evidence": deepcopy(evidence),
                            "p_evidence": 0,
                            "target_distrib": [],
                            "entropy_posterior": 0,
                            "exp_error": 1,
                        })
                # termination condition 2: no more sequenced relatives with free SNP variant
                elif len(sequenced_relatives) == 0:
                    # compute and return results
                    #todo rename variables consistentlx
                    target_distrib = np.array(netica_net.netica.getnodebeliefs(netica_net.target))
                    entropy_posterior = entropy(target_distrib)
                    exp_error = np.sum((target_distrib * (1 - target_distrib)))
                    # add the sum elements:
                    # todo with returns, not refs
                    mean_entropy_posterior[0] = mean_entropy_posterior[0] + p_inputs * entropy_posterior
                    mean_exp_error[0] = mean_exp_error[0] + p_inputs * exp_error
                    # add entry to detailed results if needed
                    if detailed_results:
                        result.append({
                            "evidence": deepcopy(evidence),
                            "p_evidence": p_inputs,
                            "target_distrib": deepcopy(target_distrib),
                            "exp_error": exp_error,
                            "entropy_posterior": entropy_posterior,
                            "product_p_evidence_entropy_posterior": p_inputs * entropy_posterior,
                        })
                # ...otherwise, continue recursion
                else:
                    # take a new sequenced relative with free SNP...
                    new_evidence_snp = sequenced_relatives.pop()
                    # ...and go to the next step of the recursion for each possible variant
                    # result = (0,0)
                    for variant in snp2int.values():
                        netica_net.netica.enterfinding(new_evidence_snp, variant)
                        evidence[new_evidence_snp] = variant
                        # todo compute at begining of func, not as argument
                        p_inputs = netica_net.netica.findingsprobability(netica_net.net)
                        compute_privacy_metrics_recursively(sequenced_relatives, p_inputs)
                        # result = (result[0] + exp_entropy, result[1] + exp_error)
                        del evidence[new_evidence_snp]
                        netica_net.netica.retractnodefindings(new_evidence_snp)
                    sequenced_relatives.append(new_evidence_snp)  # reestablish prior state of sequenced_relatives

            compute_privacy_metrics_recursively(netica_net.sequenced_relatives, 1)

            self.cache[maf] = mean_entropy_posterior[0], mean_exp_error[0]

            if detailed_results:
                # invert netica evidence dictionary
                inv_netica_nodes = {v: k for k, v in netica_net.nodes.items()}
                for res in result:
                    res["evidence"] = { inv_netica_nodes[netica_name]: v for netica_name,v in res["evidence"].items()}
                return result
            else:
                return mean_entropy_posterior[0], mean_exp_error[0]

    def get_privacy_metrics(self, maf):
        """Returns a tuple with (mean posterior entropy, mean expected error) from cache if possible and by computing it otherwise"""
        return self.cache[maf] if maf in self.cache else self.compute_privacy_metrics(maf)

    def compute_normalized_entropy(self, maf):
        """Computes normalized entropy correctly, handling lim maf->0 correctly

        It mainly handles the edge-case lim maf->0:
        - normalized entropy->0 if any sequenced individual reveals information
        - normalized entropy->1 if no sequenced individual reveals information
        """
        if len(self.sequenced_relatives())==0:
            return 1
        if math.isclose(maf, 0.0, abs_tol=ABSOLUTE_EQUALITY_TOLERANCE):
            return 0
        posterior_entropy = self.get_privacy_metrics(maf)[0]
        prior_entropy = entropy(MendelianInheritanceCPD.prior(maf)).tolist()
        return posterior_entropy / prior_entropy

    def snps_privacy_score(self, mafs_to_compute:List[float], mafs_to_interpolate = None):
        mafs_to_compute = sorted(mafs_to_compute)
        norm_post_entropies = [self.compute_normalized_entropy(maf) for maf in mafs_to_compute]
        if mafs_to_interpolate:
            return np.mean(np.interp(mafs_to_interpolate, mafs_to_compute, norm_post_entropies))
        else:
            return np.mean(norm_post_entropies)

    def get_family_relation(self, interest_node, node_other):
        """Returns the family relation of node_who relative to node_ref as a string
        
        For example, if "B" is the grandfather of "A" are in the family tree and are brothers, get_family_relation("A","B")
        should return "grandfather".  get_family_relation("B","A") Should return "grandchild".
        Covered family relation: spouse, parent, grandparent, uncle/aunt, uncle-/aunt-in-law, cousin,
        sibling, sibling-in-law, nephew/niece, child, child-in-law, grandchild.
        If the relation is further apart, it returns "other".
        If interest_node or node_other isn't in the tree, it returns a networkx NetworkXNoPath Exception."""

        # networkx Directed Graph documentation:
        # https://networkx.github.io/documentation/networkx-1.11/reference/classes.digraph.html?highlight=directed%20graph

        # networkx shortest path documentation:
        # https://networkx.github.io/documentation/networkx-1.11/reference/algorithms.shortest_paths.html?highlight=shortest%20path

        # can be used to classify relationships

        family_graph = self.inference_network
        if interest_node not in family_graph.nodes():
            raise nx.exception.NetworkXNoPath('Node "%s" not found' % interest_node)
        elif node_other not in family_graph.nodes():
            raise nx.exception.NetworkXNoPath('Node "%s" not found' % node_other)

        relation_path = nx.shortest_path(family_graph.to_undirected(),
                                         interest_node,
                                         node_other)
        relation_path.remove(interest_node)
        current_node = interest_node
        current_qualif = "you"
        for next_node in relation_path:
            if next_node in family_graph.successors(current_node):
                current_qualif = SequencedFamilyTree.relation_map[current_qualif]["successor"]

            elif next_node in family_graph.predecessors(current_node):
                current_qualif = SequencedFamilyTree.relation_map[current_qualif]['predecessor']
            current_node = next_node
        return current_qualif
