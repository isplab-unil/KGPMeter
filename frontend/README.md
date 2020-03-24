# Kin Genomic Privacy Meter Frontend

This directory contains all the HTML, CSS and Javascript code to display the KGP Meter webapp.

- `app/` contains the code (HTML, CSS and Javascript) for the app itself: building the tree, communicating with the backend, etc.
- `lib/` contains the Javascript script used to integrate the app in an other webpage.

Note: the source code is contained in `app/src/` and `lib/src/`. The directories `app/js/` and `lib/js/` contain the transpiled client facing Javascript.

## Transpiling the ES6 source code 

Note that the transpiled Javascript is already available in the `app/js/` and `lib/js/` directories.

You need to have `npm` installed to transpile the source code.
To transpile the source code, first install the required npm packages:
```
npm install
```

Then, each time you want to transpile, run the build command:
```
npm run-script build
```
Or to auto-transpile on file changes:
```
npm run-script build --watch
``` 
