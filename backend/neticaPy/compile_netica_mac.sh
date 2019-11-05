#!/bin/sh
echo "compiling"
mkdir -p lib
gcc $1/src/NeticaEx.c -c -I $1/src -L $1/lib -o lib/NeticaEx.o
g++ -shared $1/lib/libnetica.a lib/NeticaEx.o -o lib/libnetica.so

echo "done compiling"



