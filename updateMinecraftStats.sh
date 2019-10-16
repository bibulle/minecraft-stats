#!/bin/sh

# This script can be used to upgrade/compile to the latest version
# Please not that all modifications on the original files are lost (but not your conf>. files)

echo "Updating to server revision..."
git fetch --all
git reset --hard origin/master

echo "Building"
npm install

sudo systemctl daemon-reload

echo "Restarting backend"
sudo service minecraftStats stop
sleep 5
sudo service minecraftStats start

