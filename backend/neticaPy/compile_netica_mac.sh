#!/bin/sh
echo "compiling"
gcc src/NeticaEx.c -c -I./src -L./lib_mac -o lib_mac/NeticaEx.o
g++ -shared lib_mac/libnetica.a lib_mac/NeticaEx.o -o lib/libnetica.so

echo "done compiling"



