# Kin Genomic Privacy Meter

## Getting started

### Downloading Netica and installing python dependencies

KGP Meter depends on Netica, a Bayesian Network library in C. Netica needs to be download and compiled from Norsys sources:
(note: for Mac OS X you will need to have the xcode developer tools and the compilation will fire some warnings that can be safely ignored)
```
cd backend/neticaPy/
sh download_compile_netica_<your OS>.sh
cd ../..
```

Install python dependencies:
```
cd backend/
python3 -m venv venv
. venv/bin/activate
pip install -r requirements.txt
cd ..
```

### Estimate a privacy score in python

```backend/demo/demo.ipynb``` introduces the kgp_meter backend: how to create a Sequenced Family Tree and compute its target's privacy score:
```
jupyter notebook backend/demo/demo.ipynb
```

Of course, once you're done, do not forget to deactivate the python virtual environment:
```
deactivate
```

### Build a family tree in the browser and get a privacy score

Coming soon.