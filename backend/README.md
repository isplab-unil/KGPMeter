# Kin Genomic Privacy Meter backend

- ```api/``` contains the code to receive a JSON object and estimate its privacy score
- ```app.py``` contains a Flask application ready to receive JSON requests from the frontend. Once Netica and python packages are installed, it can be launched with ```python app.py -r```
- ```database/``` contains code for the database used by ```app.py```
- ```demo/``` contains basic examples of how to compute a privacy score in a family tree.
- ```kin_genomic_privacy/``` contains the essential code to estimate kin genomic privacy
- ```neticaPy/``` contains the python bindings for the Netica C API to compute belief propagation in Bayesian Networks

Follow point **A)** of the main README to install the required dependencies: Netica and python packages.