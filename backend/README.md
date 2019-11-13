# Kin Genomic Privacy Meter backend

```demo/``` contains basic examples of how to compute a privacy score in a family tree.
```kin_genomic_privacy/``` contains the essential code to estimate kin genomic privacy
```neticaPy/``` contains the python bindings for the Netica C API to compute belief propagation in Bayesian Networks
```app.py``` contains a Flask application ready to receive JSON requests from the frontend. Once Netica is installed, it can be launched with ```python app.py -r```
```api/``` contains the code to receive a JSON object and estimate its privacy score
```database/``` contains code for the database used by ```app.py```

## Downloading Netica and installing python dependencies

KGP Meter depends on Netica, a Bayesian Network library in C. Netica needs to be download and compiled from Norsys sources:
```
cd neticaPy/
sh download_compile_netica_<your OS>.sh
cd ..
```

Install python dependencies:
```
python3 -m venv venv
. venv/bin/activate
pip install -r requirements.txt
```

## Estimate a privacy score in python

```backend/demo/demo.ipynb``` introduces the kgp_meter backend: how to create a Sequenced Family Tree and compute its target's privacy score:
```
jupyter notebook demo/demo.ipynb
```

## Run KGP Meter as an API

```app.py``` creates a flask application ready to serve KGP Meter as an API, it accepts http post request containing JSON objects on the ```/privacy-score``` endpoint. It can be run with:
```python app.py -r```
[JSON requests format to be described.]


```config_default.py``` describes a default configuration for ```app.py```. It shouldn't be modified, if needed replace it instead by a proper ```config.py``` with your actual configuration.