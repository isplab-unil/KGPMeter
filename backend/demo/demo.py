
# coding: utf-8

# In[ ]:


import sys

import pandas as pd

# add path to the kgp_meter codebase
kgp_meter_relative_path = "../"
sys.path.insert(1, kgp_meter_relative_path)

from kin_genomic_privacy import SequencedFamilyTree


# # Creating a SequencedFamilyTree
# 
# A ```SequencedFamilyTree``` needs a family tree ```edges``` with _family nodes_, a list of relatives who had their genomes sequenced ```sequenced_relatives```, a ```target``` and the list of nodes who represent ```family_nodes```.

# In[ ]:


edges = [
    ("father", "family"),
    ("mother", "family"),
    ("family", "target"),
    ("family", "target"),
]
sequenced_relatives = ["father", "mother"]
target = "target"
family_nodes = ["family"]


# In[ ]:


sft = SequencedFamilyTree(edges, sequenced_relatives, target, family_nodes)


# Upon creation, the sequenced family tree's signature is computed. The signature will be the same for all trees that are equivalent (they will produce the same scores).

# In[ ]:


sft.signature


# # Computing a privacy score for a single Minor Allele Frequency/SNP

# ```sft.compute_normalized_entropy(maf)``` computes the KGP Meter privacy score for a single SNP (=a single MAF), the normalized entropy.

# In[ ]:


maf = 0.3
sft.compute_normalized_entropy(maf)


# Note that to improve performance, the ```SequencedFamilyTree``` class uses a cache: if in the same session a score is asked for another tree with the same signature, it will be returned from cache and not computed.
# 
# It is possible to get detailed results broken down in each possible combination of SNP values of the observed relatives using ```sft.compute_normalized_entropy(maf,True)```. (for evidences: 0=AA, 1=Aa, 2=aa)

# In[ ]:


nice_columns_order = ["evidence", "p_evidence", "target_distrib", "exp_error", "entropy_posterior", "product_p_evidence_entropy_posterior", "normalized_entropy"]
pd.DataFrame(sft.compute_normalized_entropy(maf,True), columns = nice_columns_order)


# # Computing a privacy score for a large number of SNPs

# A DNA test usually has information on more than 500'000 SNP, it is pointless to compute a privacy score for each SNP as we can easily approximate them with sufficient precision using interpolation.
# 
# ```sft.snps_privacy_score(mafs_to_compute, mafs_to_interpolate)``` takes a list of MAFs ```mafs_to_compute``` for which an exact privacy score is computed (or taken from cache) and a list of MAFs ```mafs_to_interpolate``` whose score will be interpolated from the first list's scores.
# 
# Here, we compute privacy scores for 16 MAFs and use them to approximate the score of the ~500k SNPs tested by 23AndMe (the approximation error is ~1.5%):

# In[ ]:


mafs_to_compute = [0.0, 0.03125, 0.0625, 0.09375, 0.125, 0.15625,0.1875, 0.21875, 0.25, 0.28125, 0.3125, 0.34375, 0.375, 0.40625, 0.4375, 0.46875, 0.5]
with open("../api/list_snp_v4.txt") as f:
    mafs_to_interpolate = sorted([float(maf) for maf in f.readlines()])


# In[ ]:


sft.snps_privacy_score(mafs_to_compute, mafs_to_interpolate)

