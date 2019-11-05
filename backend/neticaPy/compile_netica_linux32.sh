#!/bin/sh
echo "compiling"
gcc -std=gnu11 -O2 -g -fPIC -pipe -I $1/lib/ $1/src/NeticaEx.c $1/lib/libnetica.a -shared -o lib/libnetica.so -lm -lpthread -lstdc++
echo "done compiling"



