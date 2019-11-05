#!/bin/sh
echo "downloading and unzipping..."
curl -O https://www.norsys.com/downloads/NeticaAPI_Mac.zip
unzip NeticaAPI_Mac.zip
echo "compiling..."
mkdir -p lib
gcc Netica_API_504/src/NeticaEx.c -c -I Netica_API_504/src -L Netica_API_504/lib -o lib/NeticaEx.o
g++ -shared Netica_API_504/lib/libnetica.a lib/NeticaEx.o -o lib/libnetica.so

echo "done compiling, removing files"
rm NeticaAPI_Mac.zip
rm -r Netica_API_504/



 