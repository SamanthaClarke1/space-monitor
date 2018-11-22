//start viewer

// link for me to jump onto file:///Volumes/RS01/Resources/Engineering/Sam/SpaceMonitor/viewer.html

if(INARR)
	INARR = INARR.split('\n');
else alert("No input array! Are you sure you have them logs? (And you ran the monitor-prep.sh)");

//specifies how many hours it should care about per bar.
// int, not float.
// also, if you want the ticks to line up good, then you should keep this at 24 or under.
let hourStep = Math.round(2);
let trendLength = Math.round(20);

function parseLine(line) {
	// abritary length chosen to make sure its long enough to be
	// holding a unix time stamp and gb value
	if(line.length > 12) {
		let tl = line.split(' ');
		let tdate = new Date(parseInt(tl[1]));

		tdate = roundToNearestHourStep(tdate, hourStep);

		return [tl[0] * 1.024, tdate, true]; // [2] tells us if its autofill or real data.
	}
}

function parseINARR(INARR) {
	let data = [];

	for(let i = 0; i < INARR.length; i += hourStep) {
		let line = INARR[i];
		let linedata = parseLine(line);

		// if we're stepping in multiple hours (and the current linedata is valid)
		if(hourStep > 1 && linedata) {
			// get the average size from i to i + hourStep
			let olinedataVal = linedata[0];
			for(let j = i + 1; j < i + hourStep; j++) {
				let tlinedata = parseLine(INARR[j]);
				if(!tlinedata) break;
				linedata[0] += tlinedata[0];
			}
			if(linedata[0] != olinedataVal) { // if the line data changed (ie. didnt trigger the break)
				linedata[0] /= hourStep;
			}
		}
		
		if(linedata) {
			data.push(linedata);
		}
	}

	return data;
}

//takes data, and fills in any gaps between the min and max date ranges (ticks up in hours) with autofill data.
// meaning, [2] is set to false, and it guesses the projection from the last two jobs direction.
function fillGapsInData(data, minD, maxD) {
	minD = roundToNearestHourStep(minD, hourStep).getTime();
	maxD = roundToNearestHourStep(maxD, hourStep).getTime();
	if(maxD - minD <= 0) return data;

	let hourDif = (maxD - minD) / (60 * 60 * 1000);

	let viewedData = [];
	for(let i = 0; i < trendLength; i++) {
		viewedData.push([data[0], 0])
	}
	for(let i = minD; i < maxD; i += (hourStep * 60 * 60 * 1000)) {
		let ti = getIndexFromDate(data, i);

		if(ti == -1) {
			console.log('missing ', getThisDate(i), ' filling..');
			// get the difference between the oldest viewed data and
			// the most recently viewed data, then divide by
			// the distance between them to caculate the trend
			let trendDir = (viewedData[viewedData.length - 1][0][0] - viewedData[0][0][0]) / viewedData.length;
			// then get the latest data, with the trend applied
			let space = viewedData[viewedData.length - 1][0][0] + trendDir;
			let newData = [space, new Date(i), false];
			data.splice(viewedData[viewedData.length - 1][1] + 1, 0, newData);
			ti = parseInt(viewedData[viewedData.length - 1][1] + 1);
		}

		viewedData.push([data[ti], parseInt(ti)]);
		viewedData.shift();
	}

	return data;
}

let data = parseINARR(INARR);
console.log("IN DATA", data);

// get index, if cant find it, return -1
// tdate can either be a date or a unix timestamp
function getIndexFromDate(tdata, tdate) { 
	for(let i in tdata) {
		if(tdata[i][1] && tdata[i][1].getTime() == (tdate.getTime ? tdate.getTime() : tdate)) {
			return i;
		}
	}
	return -1;
}

if(data) {
	let marg = {
		top: 20,
		right: 10,
		bottom: 20,
		left: 40,
		barspace: -1,
	};
	let tiw = innerWidth - 4, tih = innerHeight - 4; // new innerWidth and innerHeight values to avoid going off screen

	let w = tiw - (marg.left + marg.right);
	let h = tih - (marg.top + marg.bottom);

	let dataD = cloneData(data).sort((a, b) => { return a[1] - b[1]; });
	let minD = dataD[0], maxD = dataD[dataD.length-1];
	let fixedData = fillGapsInData(dataD, minD[1], maxD[1]);

	let dataS = cloneData(fixedData).sort((a, b) => { return a[0] - b[0]; });
	let min = dataS[0], max = dataS[dataS.length-1];

	let bot=0, top=Math.ceil(max[0]/500)*500;

	let wscl = w / fixedData.length;
	let hscl = h / top;

	console.log('rendering with params: '+' minD: '+min[1].getTime()+
		', maxD: '+max[1].getTime()+', minS: '+min[0]+', maxS: '+max[0]+
		', botS: '+bot+', topS: '+top+
		', w: '+w+', h: '+h+', wscl: '+wscl+', hscl: '+hscl);

	const svg = d3.select('#d3table')
		.attr('width', tiw)
		.attr('height', tih);

	svg.selectAll('rect')
		.data(fixedData)
		.enter()
		.append('rect')
		.attr('x', (d, i) => { return i * wscl + marg.left})
		.attr('y', (d) => { return h - d[0] * hscl })
		.attr('width', wscl - marg.barspace)
		.attr('height', (d) => { return d[0] * hscl })
		.attr('class', (d, i) => { return 'bar ' + 
			(d[2] ? 'source' : 'autofill') + ' ' +
			(i % 2 == 0 ? 'even' : 'odd') })
		.append('title')
		.text((d) => {return (Math.round(d[0]*10)/10) + ' GB\n'+getThisDate(d[1])});

	const xScale = d3.scaleTime()
		.domain([roundToNearestHourStep(max[1], hourStep),
			addAnHourStep(roundToNearestHourStep(min[1], hourStep), hourStep)])
		.range([marg.left, w+marg.left]);

	console.log('timescale:', [roundToNearestHourStep(max[1], hourStep),
	addAnHourStep(roundToNearestHourStep(min[1], hourStep), hourStep)]);

	const yScale = d3.scaleLinear()
		.domain([bot, top])
		.range([h, 0]);

	const xAxis = d3.axisBottom(xScale);
	const yAxis = d3.axisLeft(yScale);

	svg.append('g')
		.attr('transform', 'translate(0, '+(h+2)+')')
		.call(xAxis);

	svg.append('g')
		.attr('transform', 'translate('+(marg.left-2)+', 0)')
		.call(yAxis);
}

function getThisDate(now = new Date()) {
	if(!now.getFullYear) now = new Date(now);
	return now.getFullYear() + '-' + (now.getMonth() + 1) + '-' + now.getDate() + ' ' + now.getHours() + ':' + (now.getMinutes()+'').padStart(2, '0');
}

function addAnHourStep(now, hourStep) {
	let millis = hourStep * 60 * 60 * 1000; // hourStep in milliseconds
	now.setTime(now.getTime() + millis);
	return now;
}
function roundToNearestHourStep(now, hourStep) {
	if(!now.getFullYear) now = new Date(now);
	let thours = now.getHours();
	thours = Math.round(thours / hourStep) * hourStep;

	now.setHours(thours);
	now.setMinutes(0);
	now.setSeconds(0);
	now.setMilliseconds(0);
	return now;
}
// clones the data, but preserves the data objects!!!!
// (yeah, alright, maybe i shouldnt of stored them as date obs, but its too late to change that)
function cloneData(data) {
	let ndata = JSON.parse(JSON.stringify(data));
	for(let i in ndata) {
		ndata[i][1] = new Date(ndata[i][1]);
	}
	return ndata;
}

//props to past me for the help https://codepen.io/samuel-clarke/pen/WpXOyJ

//end viewer