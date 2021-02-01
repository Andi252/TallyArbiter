var socket = null;
var sources = [];
var devices = [];
var listener_clients = [];
var noSleep = new NoSleep();
var KeepAwake = true;
var device_states = [];
var mode_preview = false;
var mode_program = false;

function onLoad() {
	socket = io.connect();
	socket.on('connect', function () {
		//connected, let's get some data
		socket.emit('producer');
	});
	socket.on('sources', function (data) {
		sources = data;
	});
	socket.on('devices', function (deviceArray) {
		//Returns a list of available Devices for the dropdown list
		devices = deviceArray;
		updateDeviceList();
		loadListeners();
	});
	socket.on('bus_options', function (busOptionsArray) {
		//Returns a list of available bus options (preview, program, etc.)
		bus_options = busOptionsArray;
	});
	socket.on('listener_clients', function (data) {
		listener_clients = data;
		loadListeners();
		loadChatTags();
	});
	socket.on('device_states', function (tallyDataArray) {
		//process the data received and determine if it's in preview or program and color the screen accordingly
		device_states = tallyDataArray;
		loadDeviceStates();
	});
	socket.on('messaging', function(type, socketid, message) {
		insertChat(type, socketid, message);
	});
	KeepScreenAwake(true); //keeps the phone from falling asleep
}

function getBusById(busId) {
	//gets the bus type (preview/program) by the bus id
	return bus_options.find(({id}) => id === busId);
}

function getDeviceById(deviceId) {
	//gets the Device by the Id
	if (deviceId !== 'unassigned') {
		return devices.find(({id}) => id === deviceId);
	}
	else {
		let deviceObj = {};
		deviceObj.id = 'unassigned';
		deviceObj.name = 'Unassigned';
		return deviceObj;
	}
}

function GetSourceById(sourceId) {
	//gets the Source by the Id
	return sources.find(({id}) => id === sourceId);
}

function GetListenersCount(deviceId) {
	let j = 0;
	for (let i = 0; i < listener_clients.length; i++) {
		if ((listener_clients[i].deviceId === deviceId) && (listener_clients[i].inactive === false)) {
			j++;
		}
	}
	return j;
}

function updateDeviceList() {
	let divDevices = $('#divDevices')[0];
	divDevices.innerHTML = '';
	let tableDevices = document.createElement('table');
	tableDevices.className = 'table';
	let trHeader = document.createElement('tr');
	let tdHeaderDeviceTallyStatus_PVW = document.createElement('td');
	tdHeaderDeviceTallyStatus_PVW.innerHTML = 'PVW';
	trHeader.appendChild(tdHeaderDeviceTallyStatus_PVW);
	let tdHeaderDeviceTallyStatus_PGM = document.createElement('td');
	tdHeaderDeviceTallyStatus_PGM.innerHTML = 'PGM';
	trHeader.appendChild(tdHeaderDeviceTallyStatus_PGM);
	let tdHeaderDeviceName = document.createElement('td');
	tdHeaderDeviceName.innerHTML = '<b>Name</b>';
	trHeader.appendChild(tdHeaderDeviceName);
	let tdHeaderDeviceCloud = document.createElement('td');
	tdHeaderDeviceCloud.innerHTML = '&nbsp;';
	trHeader.appendChild(tdHeaderDeviceCloud);
	let tdHeaderDeviceDescription = document.createElement('td');
	tdHeaderDeviceDescription.innerHTML = '<b>Description</b>';
	trHeader.appendChild(tdHeaderDeviceDescription);
	let tdHeaderDeviceEdit = document.createElement('td');
	tdHeaderDeviceEdit.innerHTML = '&nbsp;';
	trHeader.appendChild(tdHeaderDeviceEdit);
	tableDevices.appendChild(trHeader);
	for (let i = 0; i < devices.length; i++) {
		let trDeviceItem = document.createElement('tr');
		let mode_preview = false;
		let mode_program = false;
		let sources_pvw = [];
		let sources_pgm = [];
		for (let j = 0; j < device_states.length; j++) {
			if ((device_states[j].deviceId === devices[i].id) && (getBusById(device_states[j].busId).type === 'preview')) {
				if (device_states[j].sources.length > 0) {
					mode_preview = true;
					sources_pvw = device_states[j].sources;
				}
				else {
					mode_preview = false;
				}
			}
			else if ((device_states[j].deviceId === devices[i].id) && (getBusById(device_states[j].busId).type === 'program')) {
				if (device_states[j].sources.length > 0) {
					mode_program = true;
					sources_pgm = device_states[j].sources;
				}
				else {
					mode_program = false;
				}
			}
		}
		let tdDeviceTallyStatus_PVW = document.createElement('td');
		tdDeviceTallyStatus_PVW.id = 'td_tallyPVW_' + devices[i].id;
		tdDeviceTallyStatus_PVW.className = 'device_state_tally';
		if (mode_preview) {
			tdDeviceTallyStatus_PVW.className = 'device_state_tally_preview';
			if (sources_pvw.length > 0) {
				let spanSourcesText = document.createElement('span');
				spanSourcesText.className = 'sources_pvw_tooltip';
				let sourceText = '';
				for (let j = 0; j < sources_pvw.length; j++) {
					sourceText += GetSourceById(sources_pvw[j].sourceId).name;
					if ((j >= 0) && (j < sources_pvw.length - 1)) {
					sourceText += ', ';
					}
				}
				spanSourcesText.innerHTML = sourceText;
				tdDeviceTallyStatus_PVW.innerHTML = '';
				tdDeviceTallyStatus_PVW.appendChild(spanSourcesText);
			}
		}
		trDeviceItem.appendChild(tdDeviceTallyStatus_PVW);
		let tdDeviceTallyStatus_PGM = document.createElement('td');
		tdDeviceTallyStatus_PGM.id = 'td_tallyPGM_' + devices[i].id;
		tdDeviceTallyStatus_PGM.className = 'device_state_tally';
		if (mode_program) {
			tdDeviceTallyStatus_PGM.className = 'device_state_tally_program';
			if (sources_pgm.length > 0) {
				let spanSourcesText = document.createElement('span');
				spanSourcesText.className = 'sources_pgm_tooltip';
				let sourceText = '';
				for (let j = 0; j < sources_pgm.length; j++) {
					sourceText += GetSourceById(sources_pgm[j].sourceId).name;
					if ((j >= 0) && (j < sources_pgm.length - 1)) {
						sourceText += ', ';
					}
				}
				spanSourcesText.innerHTML = sourceText;
				tdDeviceTallyStatus_PGM.innerHTML = '';
				tdDeviceTallyStatus_PGM.appendChild(spanSourcesText);
			}
		}
		trDeviceItem.appendChild(tdDeviceTallyStatus_PGM);
		let tdDeviceName = document.createElement('td');
		tdDeviceName.innerHTML = devices[i].name;
		if (devices[i].enabled === false) {
			tdDeviceName.className = 'disabled';
		}
		trDeviceItem.appendChild(tdDeviceName);
		let tdDeviceCloud = document.createElement('td');
		if (devices[i].cloudConnection) {
			let imgCloud = document.createElement('img');
			imgCloud.src = 'lib/img/cloud.png';
			imgCloud.width = '20';
			tdDeviceCloud.appendChild(imgCloud);
		}
		trDeviceItem.appendChild(tdDeviceCloud);
		let tdDeviceDescription = document.createElement('td');
		tdDeviceDescription.innerHTML = devices[i].description;
		if (devices[i].enabled === false) {
			tdDeviceDescription.className = 'disabled';
		}
		trDeviceItem.appendChild(tdDeviceDescription);
		let tdDeviceListeners = document.createElement('td');
		let spanListeners = document.createElement('span');
		let listenerCount = GetListenersCount(devices[i].id);
		spanListeners.innerHTML = ((listenerCount > 0) ? listenerCount : '');
		spanListeners.className = ((listenerCount > 0) ? 'listenercount' : '');
		tdDeviceListeners.appendChild(spanListeners);
		trDeviceItem.appendChild(tdDeviceListeners);
		tableDevices.appendChild(trDeviceItem);
	}
	if (devices.length > 0) {
		divDevices.appendChild(tableDevices);
	}
	else {
		let spanNoDevices = document.createElement('span');
		spanNoDevices.innerHTML = '(no devices configured)';
		divDevices.appendChild(spanNoDevices);
	}
}

function loadDeviceStates() {
	for (let i = 0; i < devices.length; i++) {
		let mode_preview = false;
		let mode_program = false;
		let sources_pvw = [];
		let sources_pgm = [];
		for (let j = 0; j < device_states.length; j++) {
			if ((device_states[j].deviceId === devices[i].id) && (getBusById(device_states[j].busId).type === 'preview')) {
				if (device_states[j].sources.length > 0) {
					mode_preview = true;
					sources_pvw = device_states[j].sources;
				}
				else {
					mode_preview = false;
				}
			}
			else if ((device_states[j].deviceId === devices[i].id) && (getBusById(device_states[j].busId).type === 'program')) {
				if (device_states[j].sources.length > 0) {
					mode_program = true;
					sources_pgm = device_states[j].sources;
				}
				else {
					mode_program = false;
				}
			}
		}
		let tdDeviceTallyStatus_PVW = document.getElementById('td_tallyPVW_' + devices[i].id);
		if (tdDeviceTallyStatus_PVW) {
			if (mode_preview) {
				tdDeviceTallyStatus_PVW.className = 'device_state_tally_preview';
				if (sources_pvw.length > 0) {
					let spanSourcesText = document.createElement('span');
					spanSourcesText.className = 'sources_pvw_tooltip';
					let sourceText = '';
					for (let j = 0; j < sources_pvw.length; j++) {
					sourceText += GetSourceById(sources_pvw[j].sourceId).name;
					if ((j >= 0) && (j < sources_pvw.length - 1)) {
						sourceText += ', ';
					}
					}
					spanSourcesText.innerHTML = sourceText;
					tdDeviceTallyStatus_PVW.innerHTML = '';
					tdDeviceTallyStatus_PVW.appendChild(spanSourcesText);
				}
			}
			else {
				tdDeviceTallyStatus_PVW.className = 'device_state_tally';
				tdDeviceTallyStatus_PVW.innerHTML = '';
			}
		}
		let tdDeviceTallyStatus_PGM = document.getElementById('td_tallyPGM_' + devices[i].id);
		if (tdDeviceTallyStatus_PGM) {
			if (mode_program) {
				tdDeviceTallyStatus_PGM.className = 'device_state_tally_program';
				if (sources_pgm.length > 0) {
					let spanSourcesText = document.createElement('span');
					spanSourcesText.className = 'sources_pgm_tooltip';
					let sourceText = '';
					for (let j = 0; j < sources_pgm.length; j++) {
					sourceText += GetSourceById(sources_pgm[j].sourceId).name;
					if ((j >= 0) && (j < sources_pgm.length - 1)) {
						sourceText += ', ';
					}
					}
					spanSourcesText.innerHTML = sourceText;
					tdDeviceTallyStatus_PGM.innerHTML = '';
					tdDeviceTallyStatus_PGM.appendChild(spanSourcesText);
				}
			}
			else {
				tdDeviceTallyStatus_PGM.className = 'device_state_tally';
				tdDeviceTallyStatus_PGM.innerHTML = '';
			}
		}
	}
}

function loadListeners() {
	let divListeners = $('#divListeners')[0];
	if (listener_clients.length > 0) {
		divListeners.innerHTML = '';
		let tableListeners = document.createElement('table');
		let trHeader = document.createElement('tr');
		let tdHeaderIPAddress = document.createElement('td');
		tdHeaderIPAddress.innerHTML = '<b>IP</b>';
		trHeader.appendChild(tdHeaderIPAddress);
		let tdHeaderListenerType = document.createElement('td');
		tdHeaderListenerType.innerHTML = '<b>Type</b>';
		trHeader.appendChild(tdHeaderListenerType);
		let tdHeaderListenerCloud = document.createElement('td');
		tdHeaderListenerCloud.innerHTML = '&nbsp;';
		trHeader.appendChild(tdHeaderListenerCloud);
		let tdHeaderDeviceName = document.createElement('td');
		tdHeaderDeviceName.innerHTML = '<b>Device</b>';
		trHeader.appendChild(tdHeaderDeviceName);
		let tdHeaderButtons = document.createElement('td');
		tdHeaderButtons.innerHTML = '&nbsp;';
		trHeader.appendChild(tdHeaderButtons);
		tableListeners.appendChild(trHeader);
		for (let i = 0; i < listener_clients.length; i++) {
			let listenerDevice = getDeviceById(listener_clients[i].deviceId);

			let trClientItem = document.createElement('tr');
			let tdIPAddress = document.createElement('td');
			tdIPAddress.innerHTML = listener_clients[i].ipAddress.replace('::ffff:', '');
			trClientItem.appendChild(tdIPAddress);
			let tdListenerType = document.createElement('td');
			tdListenerType.innerHTML = listener_clients[i].listenerType;
			trClientItem.appendChild(tdListenerType);
			let tdListenerCloud = document.createElement('td');
			if (listener_clients[i].cloudConnection) {
				let imgCloud = document.createElement('img');
				imgCloud.src = 'lib/img/cloud.png';
				imgCloud.width = '20';
				tdListenerCloud.appendChild(imgCloud);
			}
			trClientItem.appendChild(tdListenerCloud);
			let tdDevice = document.createElement('td');
			if (listenerDevice) {
				tdDevice.innerHTML = listenerDevice.name;
			}
			else {
				tdDevice.innerHTML = '';
			}
			trClientItem.appendChild(tdDevice);
			let tdButtons = document.createElement('td');
			if (listener_clients[i].inactive === true) {
				trClientItem.className = 'disabled';
			}
			else if (listener_clients[i].canBeFlashed === false) {
				let spanFlash = document.createElement('span');
				spanFlash.innerHTML = '&nbsp;';
				tdButtons.appendChild(spanFlash);
			}
			else {
				let btnFlash = document.createElement('button');
				btnFlash.className = 'btn btn-dark mr-1';
				btnFlash.innerHTML = 'Flash';
				btnFlash.setAttribute('onclick', 'Listener_Flash(\'' + listener_clients[i].id + '\');');
				tdButtons.appendChild(btnFlash);
			}
			trClientItem.appendChild(tdButtons);
			tableListeners.appendChild(trClientItem);
		}
		divListeners.appendChild(tableListeners);
		divListeners.style.display = 'block';
	}
	else {
		divListeners.style.display = 'none';
	}
}

function Listener_Flash(id) {
	socket.emit('flash', id);
}

function KeepScreenAwake(value) { //keeps the phone screen on if true by using the NoSleep library - playing a dummy video in the background
	if (value) {                        
		noSleep.enable();                                                                                                                                
	}                                                                                                                                                                            
	else {
		noSleep.disable();
	}
}

//CHAT/MESSAGING
var chat_me = producer;

function loadChatTags() {
	chatTags = [];
	for (let i = 0; i < listener_clients.length; i++) {
		let listenerString = listener_clients[i].ipAddress.replace('::ffff:', '') + '::' + listener_clients[i].socketId;
		chatTags.push(listenerString);
	}
	/*$('input#chat-text').autocomplete({
		source: chatTags,
		minLength: 0
	});*/
}

window.onload = onLoad;