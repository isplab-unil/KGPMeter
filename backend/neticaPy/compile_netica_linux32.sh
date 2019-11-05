#!/bin/sh
echo "compiling"
gcc -std=gnu11 -O2 -g -fPIC -pipe -I./lib_linux src/NeticaEx.c lib_linux/libnetica_32bit.a -shared -o lib/libnetica.so -lm -lpthread -lstdc++
echo "done compiling"



