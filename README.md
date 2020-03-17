# Kin Genomic Privacy Meter

This git repo is the companion to our paper [_KGP Meter: Communicating Kin Genomic Privacy to the Masses_][KGPMeter_paper_url] presenting KGPMeter. Here is the paper's abstract:
>Direct-to-consumer genetic testing services are gaining a lot of momentum: As of today, companies such as 23andMe or AncestryDNA have already attracted 26 million customers, and the trend is certainly not about to cease. These services obviously raise new concerns regarding privacy, exacerbated by the fact that their customers can then share their genomic data on platforms such as GEDmatch. Notwithstanding their right to know more about their genetic background or to share their genomic data, individuals must realize that such a behavior damages their relatives’ genomic privacy.
>
>In this paper, we present KGP Meter, a new online tool that provides means for raising awareness in the general public about the privacy risks of genomic data sharing. Our tool features various properties that makes it highly interactive, privacy-preserving (i.e., it does not require access to actual genomic data), and user-friendly. It explores possible configurations in an optimized way and combines well-established graphical models with an entropy-based metric to compute kin genomic privacy scores. Our benchmarking experiments show that KGP Meter is very reactive, it provides privacy scores in less than a second on average. We design and implement an interface that enables users to draw their family trees and indicate which of their relatives’ genomes are known, and that communicates the resulting privacy scores to the users. By analyzing the usage of our tool and surveying its users, we observe that most users find the privacy score worrisome, and that the large majority of them find KGP Meter useful.

## Getting started

This repository is intended for people that either want to add the KGPMeter web app to their website or are interested in using the KGPMeter codebase. If you want to evalulate scenarios of kin genomic privacy, head to our dedicated website [santeperso.unil.ch][our_website]. If you want to learn about the scientific foundations of KGPMeter head to our [paper][KGPMeter_paper_url].

There are 3 possible use-cases documented here:
1. Integrate the KGPMeter web app into a website (using our backend or your own).
2. Run the KGPMeter backend and serve the KGPMeter web app from your own machine.
3. Use the KGPMeter python API to explore kin genomic privacy scenarios with code.

For 2. and 3., you will need to first follow the appendix guide to _A) Download Netica and install python dependencies_ at the end of this README.

### 1. Integrate the KGPMeter web app into a website

You can find html integration examples in the [KGPMeter_integration_example.html](./KGPMeter_integration_example.html) file.

The first and simplest method to integrate the KGPMeter web app is to add two tags to your webpage:
```
<div id="kin-genomic-privacy-meter"></div>
<script src="path/to/kgpmeter.js"></script>
```
Where `path/to/kgpmeter.js` corresponds to the `frontend/lib/js/kgpmeter.js` file.
The `kgpmeter.js` script looks for a `<div>` with id `kin-genomic-privacy-meter`.
If it finds it, the script automatically creates a kgpmeter instance in it, using by default our [api endpoint].

It is also possible to specify some options using optional `data-` attributes :
```
<div id="kin-genomic-privacy-meter" data-kgpmeter-api-url="https://santeperso.unil.ch/api-dev/" data-kgpmeter-lng="en" data-kgpmeter-max-height="1000"></div>
<script src="path/to/kgpmeter.js"></script>
```
`data-kgpmeter-api-url` specifies the url of the used KGPMeter backend, here our default [api endpoint] endpoint. Once you have set up your own KGPMeter backend, you can use its url.
The two other `data-` attributes allow to set the web app language and maximum height (in pixel), if not present they default to `"en"` and `1000`. Available languages are `["en", "fr", "it", "de", "es"]`, the `data-kgpmeter-max-height` should be at least `600`.

The second method to integrate KGPMeter in a webpage is to create a KGPMeter instance with javascript, the only advantage being the ability to use another `<div>` id:
```
<div id="kgp-meter"></div>
<script src="path/to/kgpmeter.js"></script>
<script type="text/javascript">
  kgpmeter = new KgpMeter(
    "kgp-meter",
    "https://santeperso.unil.ch/api-dev/",
    "it",
    600
  )
</script>
```


### 2. Run the KGPMeter backend and serve the KGPMeter web app

If it is not already done, follow the guide _A) Download Netica and install python dependencies_ below to have Netica and python dependencies installed.

`TODO`

### 3. Use the KGPMeter python API

If it is not already done, follow the guide _A) Download Netica and install python dependencies_ below to have Netica and python dependencies installed.

`backend/demo/demo.ipynb` introduces the kgp_meter backend: how to create a Sequenced Family Tree and compute its target's privacy score:
```
jupyter notebook backend/demo/demo.ipynb
```


### A) Download Netica and install python dependencies

The KGP Meter backend depends on Netica, a Bayesian Network library in C. Netica needs to be download and compiled from Norsys sources.
Notes:
- for Mac OS X you will need to have the (free) Xcode developer tools and the compilation will fire some warnings that can be safely ignored.
- for Windows, we don't have a download_compile script yet. If you write one, we would be very happy to add it!

In the repo folder, run the following commands:
```
cd backend/neticaPy/
sh download_compile_netica_<your OS: mac, linux64 or linux32>.sh
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

With the depedencies installed and the virtual environment activated, you can then follow wiht 2) or 3).
Once you're done, you can deactivate the python virtual environment:
```
deactivate
```

[KGPMeter_paper_url]: santeperso.unil.ch/privacy-dev/?test
[our_website]: santeperso.unil.ch/privacy-dev/?github
[api endpoint]: https://santeperso.unil.ch/api-dev/
