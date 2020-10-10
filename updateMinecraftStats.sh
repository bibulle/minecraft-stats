#!/bin/sh -e

# This script can be used to upgrade/compile to the latest version
# Please not that all modifications on the original files are lost (but not your conf>. files)

echo "Updating to server revision..."
#git fetch --all
#git reset --hard origin/master

echo "Building"
#npm install

set -x

if [ $(uname) == "Darwin" ]
then
   sudo cp ./com.bibulle.minecraftStats.plist /Library/LaunchDaemons
   sudo chown root "/Library/LaunchDaemons/com.bibulle.minecraftStats.plist"
   sudo chmod 644 "/Library/LaunchDaemons/com.bibulle.minecraftStats.plist"
   sudo launchctl unload "/Library/LaunchDaemons/com.bibulle.minecraftStats.plist"
   sudo launchctl load "/Library/LaunchDaemons/com.bibulle.minecraftStats.plist"

else
   sudo systemctl daemon-reload

   echo "Restarting backend"
   sudo service minecraftStats stop
   sleep 5
   sudo service minecraftStats start
fi

exit

