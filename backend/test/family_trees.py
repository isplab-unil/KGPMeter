# -*- coding: utf-8 -*-
__author__ = "Didier Dupertuis, Benjamin Trubert, Kévin Huguenin"
__copyright__ = "Copyright 2019, The Information Security and Privacy Lab at the University of Lausanne (https://www.unil.ch/isplab/)"
__credits__ = ["Didier Dupertuis", "Benjamin Trubert", "Kévin Huguenin", "Mathias Humbert"]

__version__ = "1"
__license__ = "MIT"
__maintainer__ = "Didier Dupertuis"
__email__ = "didier.dupertuis@unil.ch"

__project__ = "Data-less Kin Genomic Privacy Estimator"


# This files defines 2 lists of family trees for testing:
# - sfts_maxi is based on a large tree with many node that are removed upon minimization
# - sfts_mini is based on the equivalent minimal tree of sfts_maxi
# The variation in the lists are based on different configurations of the sequenced relatives
#
# json_to_send of unminimized tree:
# {"timestamp_js": 1557492569135,
# "family_tree": {
#     "edges": [["@F1@", "@I1@"], ["@I3@", "@F1@"], ["@I2@", "@F1@"], ["@F2@", "@I2@"], ["@I4@", "@F2@"], ["@F1@", "@I5@"],
#               ["@F1@", "@I6@"], ["@I1@", "@F3@"], ["@F3@", "@I7@"], ["@F3@", "@I8@"], ["@F3@", "@I9@"], ["@I8@", "@F4@"],
#               ["@F4@", "@I10@"], ["@I11@", "@F5@"], ["@I9@", "@F5@"]],
#     "sequenced_relatives": ["@I2@", "@I4@", "@I5@", "@I6@", "@I7@", "@I11@"],
#     "target": "@I1@"
# },
# "user": {"id": "1557492477218-0.8742201594101999", "source": "http://localhost:4000/privacy-dev/tool/", "lng": "en"}}
#
# json_to_send of hand-minimized tree:
# {"timestamp_js":1557492681404,
# "family_tree":{
#     "edges":[["@F1@","@I1@"],["@I3@","@F1@"],["@I2@","@F1@"],["@F1@","@I5@"],["@F1@","@I6@"],["@I1@","@F3@"],["@F3@","@I7@"]],
#     "sequenced_relatives":["@I2@","@I5@","@I6@","@I7@"],
#     "target":"@I1@"
# },
# "user":{"id":"1557492477218-0.8742201594101999","source":"http://localhost:4000/privacy-dev/tool/","lng":"en"}}


from kin_genomic_privacy import SequencedFamilyTree

target = "@I1@"

edges_mini = [("@F1@", "@I1@"), ("@I3@", "@F1@"), ("@I2@", "@F1@"), ("@F1@", "@I5@"), ("@F1@", "@I6@"), ("@I1@", "@F3@"),("@F3@","@I7@")]
sequenced_relatives_mini = [
    ["@I2@","@I3@"],
    ["@I2@"],
    ["@I2@", "@I5@"],
    ["@I2@", "@I5@", "@I6@"],
    ["@I5@", "@I6@", "@I7@"],
    ["@I2@", "@I5@", "@I6@", "@I7@"]
]
family_nodes_mini = [node for edge in edges_mini for node in edge if "F" in node or "f" in node]

edges_maxi = [("@F1@", "@I1@"), ("@I3@", "@F1@"), ("@I2@", "@F1@"), ("@F2@", "@I2@"), ("@I4@", "@F2@"), ("@F1@", "@I5@"),
              ("@F1@", "@I6@"), ("@I1@", "@F3@"), ("@F3@", "@I7@"), ("@F3@", "@I8@"), ("@F3@", "@I9@"), ("@I8@", "@F4@"),
              ("@F4@", "@I10@"), ("@I11@", "@F5@"), ("@I9@", "@F5@")]
sequenced_relatives_maxi = [
    ["@I2@", "@I4@","@I3@"],
    ["@I2@", "@I4@"],
    ["@I2@", "@I4@", "@I5@"],
    ["@I2@", "@I4@", "@I5@", "@I6@"],
    ["@I5@", "@I6@", "@I7@", "@I11@"],
    ["@I2@", "@I4@", "@I5@", "@I6@", "@I7@", "@I11@"]
]
family_nodes_maxi = [node for edge in edges_maxi for node in edge if "F" in node or "f" in node]

sfts_mini = [SequencedFamilyTree(edges_mini, seq_rel, target, family_nodes_mini) for seq_rel in sequenced_relatives_mini]
sfts_maxi = [SequencedFamilyTree(edges_maxi, seq_rel, target, family_nodes_maxi) for seq_rel in sequenced_relatives_maxi]