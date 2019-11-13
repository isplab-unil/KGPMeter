# Kin Genomic Privacy Meter backend

```demo/``` contains basic examples of how to compute a privacy score in a family tree.
```kin_genomic_privacy/``` contains the essential code to estimate kin genomic privacy
```neticaPy/``` contains the python bindings for the Netica C API to compute belief propagation in Bayesian Networks
```app.py``` contains a Flask application ready to receive JSON requests from the frontend. Once Netica is installed, it can be launched with ```python app.py -r```
```api/``` contains the code to receive a JSON object and estimate its privacy score
```database/``` contains code for the database used by ```app.py```

## Downloading and compiling Netica

To use Netica on your machine, it needs to be download and compiled from Norsys sources.
Run the shell script "backend/neticaPy/download_compile_netica_<your OS>.sh" corresponding to your OS in the ```backend/neticaPy/``` folder to do so.

## Estimate a privacy score in python

```backend/demo/demo.ipynb``` introduces the kgp_meter backend: how to create a Sequenced Family Tree and compute its target's privacy score.

## Run KGP Meter as an API

```app.py``` creates a flask application ready to serve KGP Meter as an API, it takes JSON objects on the ```/privacy-score``` endpoint. Format to be described.

```config_default.py``` describes a default configuration for ```app.py```. It shouldn't be modified. If needed, replace it instead by a proper ```config.py``` with your actual configuration.