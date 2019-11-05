#!/bin/sh
echo "downloading and unzipping..."
curl -O https://www.norsys.com/downloads/NeticaAPI_Linux.zip
unzip NeticaAPI_Linux.zip
echo "compiling..."
mkdir -p lib
gcc -std=gnu11 -O2 -g -fPIC -pipe -I $1/lib/64bit/ $1/src/NeticaEx.c $1/lib/64bit/libnetica.a -shared -o lib/libnetica.so -lm -lpthread -lstdc++

echo "done compiling, removing files"
rm NeticaAPI_Linux.zip
rm -r Netica_API_504/



 