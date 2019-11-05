# -*- coding: utf-8 -*-

"""Note: must have the compiled libnetica.so available as ./lib/libnetica.so.
The netica API sources are available (uncompiled) at https://www.norsys.com/netica_c_api.htm#download"""
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
import platform
from ctypes import cdll #, windll

logger = logging.getLogger(__name__)

from ctypes import c_ubyte, c_char_p, c_void_p, c_int, c_float, c_double, create_string_buffer, POINTER

c_double_p = POINTER(c_double)

# constants
# TODO: ELIMINATE CONSTANT
MESGLEN = 600
NO_VISUAL_INFO = 0
NO_WINDOW = 0x10
MINIMIZED_WINDOW = 0x30
REGULAR_WINDOW = 0x70

# src/NeticaEx.c needs to be compiled to libnetica.so with corresponding mac/linux compile shell script
NETICA_LIB = os.path.join(os.path.split(__file__)[0], 'lib', 'libnetica.so')


class Netica:
    """
    Wrapper for the netica dll
    """

    def __init__(self):
        """
        initialize the Netica class
        """
        if not os.path.exists(NETICA_LIB):
            # library Netica.dll or libnetica.so not found
            err = RuntimeError('"%s" NOT FOUND at\n %s' % (os.path.split(NETICA_LIB)[-1], NETICA_LIB))
            logger.error(err)
            raise err

        if 'window' in platform.system().lower():
            self.ln = windll.LoadLibrary(NETICA_LIB)
        else:
            self.ln = cdll.LoadLibrary(NETICA_LIB)

    def newenv(self):
        """
        open environment
        """
        # (const char* license, environ_ns* env, const char* locn)
        self.ln.NewNeticaEnviron_ns.argtypes = [c_char_p, c_void_p, c_char_p]
        self.ln.NewNeticaEnviron_ns.restype = c_void_p
        return self.ln.NewNeticaEnviron_ns(None, None, None)  # env_p

    def initenv(self, env_p):
        mesg = create_string_buffer(MESGLEN)
        # (environ_ns* env, char* mesg)
        self.ln.InitNetica2_bn.argtypes = [c_void_p, c_char_p]
        self.ln.InitNetica2_bn.restype = c_int
        res = self.ln.InitNetica2_bn(env_p, mesg)
        logger.info(mesg.value)
        return res

    def closeenv(self, env_p):
        """
        close environment
        """
        # (environ_ns* env, char* mesg)
        self.ln.CloseNetica_bn.argtypes = [c_void_p, c_char_p]
        self.ln.CloseNetica_bn.restype = c_int
        mesg = create_string_buffer(MESGLEN)
        res = self.ln.CloseNetica_bn(env_p, mesg)
        logger.info(mesg.value)
        return res

    def newnet(self, name=None, env_p=None):
        """
        Creates and returns a new net, initially having no nodes
        """
        # (const char* name, environ_ns* env)
        self.ln.NewNet_bn.argtypes = [c_char_p, c_void_p]
        self.ln.NewNet_bn.restype = c_void_p
        return self.ln.NewNet_bn(name, env_p)  # net_p

    def compilenet(self, net):
        """
        compile net
        """
        # (net_bn* net)
        self.ln.CompileNet_bn.argtypes = [c_void_p]
        self.ln.CompileNet_bn.restype = None
        self.ln.CompileNet_bn(net)

    def enterfinding(self, node_p, state):
        """
        Enters the discrete finding state for node. This means that in the case currently being analyzed, node is known with certainty to have value state.
        """
        # (	node_bn*  node,   state_bn  state )
        self.ln.EnterFinding_bn.argtypes = [c_void_p, c_int]
        self.ln.EnterFinding_bn.restype = None
        self.ln.EnterFinding_bn(node_p, state)

    def retractnodefindings(self, node_p):
        """
        Retract all findings from node
        """
        # (node_bn* node)
        self.ln.RetractNodeFindings_bn.argtypes = [c_void_p]
        self.ln.RetractNodeFindings_bn.restype = None
        self.ln.RetractNodeFindings_bn(node_p)

    def retractnetfindings(self, net_p):
        """
        Retracts all findings (i.e., the current case) from all the nodes in net, except "constant" nodes (use retractnodefindings for that)
        """
        # (net_bn* net)
        self.ln.RetractNetFindings_bn.argtypes = [c_void_p]
        self.ln.RetractNetFindings_bn.restype = None
        self.ln.RetractNetFindings_bn(net_p)

    def getnodenumberstates(self, node_p):
        """
        get number of states
        """
        # (const node_bn* node)
        self.ln.GetNodeNumberStates_bn.argtypes = [c_void_p]
        self.ln.GetNodeNumberStates_bn.restype = c_int
        return self.ln.GetNodeNumberStates_bn(node_p)  # nstates

    def getnodebeliefs(self, node_p):
        """
        get node beliefs
        """
        nstates = self.getnodenumberstates(node_p)
        # (node_bn* node)
        self.ln.GetNodeBeliefs_bn.argtypes = [c_void_p]
        self.ln.GetNodeBeliefs_bn.restype = POINTER(c_float * nstates)
        return list(self.ln.GetNodeBeliefs_bn(node_p).contents)  # prob_bn

    def findingsprobability(self, net_p):
        """
        Returns the joint probability of the findings entered into net so far (including any negative or likelihood findings).
        """
        # (net_bn* net)
        self.ln.FindingsProbability_bn.argtypes = [c_void_p]
        self.ln.FindingsProbability_bn.restype = c_double
        return self.ln.FindingsProbability_bn(net_p)

    def setnodestatenames(self, node_p, state_names):
        # (node_bn* node, const char* state_names)
        self.ln.SetNodeStateNames_bn.argtypes = [c_void_p, c_char_p]
        self.ln.SetNodeStateNames_bn.restype = None
        self.ln.SetNodeStateNames_bn(node_p, state_names)

    def setnodeprobs(self, node_p, parent_states, probs):
        self.ln.SetNodeProbs_bn.argtypes = [c_void_p, c_void_p, c_void_p]
        self.ln.SetNodeProbs_bn.restype = None
        # import pdb
        # pdb.set_trace()

        parent_states_C = (c_int * len(parent_states))(*parent_states)
        probs_C = (c_float * len(probs))(*probs)

        self.ln.SetNodeProbs_bn(node_p, parent_states_C, probs_C)

    def newnode(self, name=None, num_states=0, net_p=None):
        """
        Creates and returns a new node
        """
        # (const char* name, int num_states, net_bn* net)
        self.ln.NewNode_bn.argtypes = [c_char_p, c_int, c_void_p]
        self.ln.NewNode_bn.restype = c_void_p
        return self.ln.NewNode_bn(name, num_states, net_p)  # node_p

    def addlink(self, parent=None, child=None):
        """
        Adds a link from node parent to node child, and returns the index of the added link
        """
        # (node_bn* parent, node_bn* child)
        self.ln.AddLink_bn.argtypes = [c_void_p, c_void_p]
        self.ln.AddLink_bn.restype = c_int
        return self.ln.AddLink_bn(parent, child)  # link_index

    def getnetnodes2(self, net_p):
        self.ln.GetNetNodes_bn.argtypes = [c_void_p]
        self.ln.GetNetNodes_bn.restype = c_ubyte
        return self.ln.GetNetNodes_bn(net_p)


