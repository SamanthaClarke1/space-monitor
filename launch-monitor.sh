#!/usr/bin/bash

# starts logging to ./log, with a process fork so you can close the terminal after.
(
while true; do
	df -BG --sync /Volumes/RS01/Projects/ --output=avail | xargs -n1 | sed --expression 's/[^0-9]*//g' | tr -d '\040\011\012\015' | tee -a ./log
	printf " %s\n" "$(date '+%s')000" | tee -a ./log # the 000 is there because i couldn't find unix milli, only unix sec
	/Volumes/RS01/Resources/Engineering/Sam/SpaceMonitor/monitor-prep.sh

	sleep 3600 # sleep an hour and log again!
done
) &
