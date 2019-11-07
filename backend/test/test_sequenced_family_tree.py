# -*- coding: utf-8 -*-
__author__ = "Didier Dupertuis, Benjamin Trubert, Kévin Huguenin"
__copyright__ = "Copyright 2019, The Information Security and Privacy Lab at the University of Lausanne (https://www.unil.ch/isplab/)"
__credits__ = ["Didier Dupertuis", "Benjamin Trubert", "Kévin Huguenin", "Mathias Humbert"]

__version__ = "1"
__license__ = "MIT"
__maintainer__ = "Didier Dupertuis"
__email__ = "didier.dupertuis@unil.ch"

__project__ = "Data-less Kin Genomic Privacy Estimator"


from test.family_trees import *
from kin_genomic_privacy.sequenced_family_tree import SequencedFamilyTree
import traceback

def test_SequencedFamilyTree_minimization():
    """
    Test that SequencedFamilyTree:
    - correctly minimize a large family tree to its minimal form, with different configurations of sequenced relatives
    - obtains the same signature as a reference
    """

    reference_signatures = [ #output on 10.5.2019
        '735d97cfa7a858076744d407f765e933',
        'c21bc2111ed8af48d960d2729f1bad12',
        'a1f8c989e4bbff9b04584f25be1f888e',
        '5f10a2d2a43174cb9e6f1ac729e8c7c8',
        '590f085835d4b3879e3c4467eaf2119f',
        '4bcdbceb980a95620ef4820efcbefd72']
    sft_mini_sig = [sft.signature for sft in sfts_mini]
    sft_maxi_sig = [sft.signature for sft in sfts_maxi]

    print("\n\nreference_signatures")
    print(reference_signatures)
    print("sft_mini signatures")
    print(sft_mini_sig)
    print("sft_maxi signatures")
    print(sft_maxi_sig)

    assert(reference_signatures==sft_mini_sig)
    assert(sft_maxi_sig==sft_mini_sig)

    print("\ntest_SequencedFamilyTree_minimization() SUCCESS!")




def test_get_family_relation(sft):
  """Tests that SequencedFamilyTree.get_family_relation(A,B):
  - correctly identifies relations
  - correctly throws a NodeNotFound error"""


  print("sft.nodes")
  print(sft.nodes)

  assert(sft.get_family_relation("you", "grandfather") == "grandparent")
  assert(sft.get_family_relation("you", "father") == "parent")
  assert(sft.get_family_relation("you", "mother") == "parent")
  assert(sft.get_family_relation("you", "uncle1") == "uncle/aunt")
  assert(sft.get_family_relation("you", "aunt-in-law1") == "uncle-/aunt-in-law")
  assert(sft.get_family_relation("you", "cousin1") == "cousin")
  assert(sft.get_family_relation("you", "brother1") == "sibling")
  assert(sft.get_family_relation("you", "sister1") == "sibling")
  assert(sft.get_family_relation("you", "child1") == "child")
  assert(sft.get_family_relation("you", "sister-in-law1") == "sibling-in-law")
  assert(sft.get_family_relation("you", "niece1") == "nephew/niece")
  assert(sft.get_family_relation("you", "son-in-law1") == "child-in-law")
  assert(sft.get_family_relation("you", "grandchild1") == "grandchild")

  #assert (sft.get_family_relation("you", "granduncle") == "grand uncle/aunt")
  assert (sft.get_family_relation("you", "cousinOnceRemoved") == "cousin once-removed")
  assert (sft.get_family_relation("you", "greatgrandfather") == "great grandparent")
  assert (sft.get_family_relation("you", "secondcousin") == "second cousin")
  assert (sft.get_family_relation("you", "greatgrandniece") == "great grand nephew/niece")


  print('all assertion passed sucessfully,')
  try:
      sft.get_family_relation('babar','mother')
  except Exception as e:
      print('sucessfully threw the NetworkxNoPath Exception:', traceback.format_exc())
      return -1


if __name__ == '__main__':
    edges = [

        ("greatgrandfather", "Fgreatgrandparent"),
        ('Fgreatgrandparent', 'grandfather'),
        ('Fgreatgrandparent','granduncle'),

        ('granduncle','Fgranduncle'),
        ('Fgranduncle','cousinOnceRemoved'),

        ('cousinOnceRemoved','FcousinOnceRemoved'),
        ('FcousinOnceRemoved','secondcousin'),

        ("grandfather", "Fgrandparents"),  # Fgrandfather est le fils de grandfather
        ("Fgrandparents", "father"),
        ("Fgrandparents", "uncle1"),

        ("uncle1", "Funcle1"),
        ("aunt-in-law1", "Funcle1"),
        ("Funcle1", "cousin1"),

        ("father", "Fparents"),
        ("mother", "Fparents"),
        ("Fparents", "you"),
        ("Fparents", "sister1"),
        ("Fparents", "brother1"),

        ("you", "Fyou"),
        ("spouse", "Fyou"),
        ("Fyou", "child1"),
        ("Fyou", "child2"),

        ("brother1", "Fbrother1"),
        ("sister-in-law1", "Fbrother1"),
        ("Fbrother1", "niece1"),
        ("niece1",'Fniece1'),
        ('Fniece1','grandniece'),
        ('grandniece','Fgrandniece'),
        ('Fgrandniece', 'greatgrandniece'),

        ("child1", "Fchild1"),
        ("son-in-law1", "Fchild1"),
        ("Fchild1", "grandchild1")
    ]
    sequenced_relatives = ["aunt-in-law1", "cousin1", "mother", "sister1", "spouse", "child2", "sister-in-law1",
                           "niece1", "son-in-law1", "grandchild1"]
    family_nodes = ["Fgreatgrandparent","Fgrandparents", "Fgranduncle","Funcle1", "FcousinOnceRemoved","Fparents", "Fyou", "Fbrother1", "Fchild1", "Fniece1", "Fgrandniece"]

    sft = SequencedFamilyTree(edges, sequenced_relatives, "you", family_nodes, minimize=False)

    test_SequencedFamilyTree_minimization()
    test_get_family_relation(sft)