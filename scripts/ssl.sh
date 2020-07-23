#!/bin/bash
echo "Start building openssl."
echo "openssl directory: $1"
echo "openssl compiled path: $2"
cd $1

./config --prefix=$2

make

make install

echo "Finish build openssl."