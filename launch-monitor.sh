#!/usr/bin/bash

# look at that fancy process fork ;) # learnt that one two days ago ;)
(
while true; do
	# okay so this only took me like 5 minutes to write... am i actually getting good at bash?
	# (insert scene with neo in the matrix, binary falling all around him whilst he looks at his hands, here)
	# (or just run cmatrix)
	# (or you could, if it was in the centos yum repos, at least >:( )
	df -BG --sync /Volumes/RS01/Projects/ --output=avail | xargs -n1 | sed --expression 's/[^0-9]*//g' | tr -d '\040\011\012\015' | tee -a ./log
	printf " %s\n" "$(date '+%s')000" | tee -a ./log # the 000 is there because i couldn't find milliseconds since 1/1/1970 lmao
	/Volumes/RS01/Resources/Engineering/Sam/SpaceMonitor/monitor-prep.sh

	sleep 3600 # sleep an hour and log again!
done
) &

#reminder to self to write a little d3 grapher for this
#ooooh actually maybe i should use some python with scipy or matplot or something, that'd be pretty cool, and it'd run right here so no need to bother with d3!
#although d3 is instantly cross platform
#but i wouldnt have to bother with the nodeJS boiler plate...
#OH! I got it! uses bash to make a js file (stupid, i know, but stick with me), and then the d3 webpage links that in!
#if you dont get the idea the bash js file would just be a little array declaration, could even do it with sed haha
#or even just a string declaration i'll edit with javascript!
#okay thats the final idea, locking it in, the other script will be like, monitor-prep.sh
