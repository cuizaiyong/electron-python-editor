#!/bin/bash

echo "Start building Python runtime."

cd $1

./configure --prefix=$2

make

make install

echo "Finish building Python runtime."