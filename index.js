var Service;
var Characteristic;
var FakeGatoHistoryService;

var net = require('net');
var moment = require('moment');
var inherits = require('util').inherits;
var pollingtoevent = require("polling-to-event");
var parseString = require('xml2js').parseString;
var request = require('request');



module.exports = function(homebridge) {
	_homebridge = homebridge
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
	FakeGatoHistoryService = require('fakegato-history')(homebridge);
  homebridge.registerAccessory("homebridge-tcp", "TCP", TcpAccessory);
}

function TcpAccessory(log, config) {
	this.timer;
  this.log				   = log;
  this.name		       = config['name'];
	this.user		       = config['user'];
	this.pass		       = config['pass'];
  this.onCommand	   = config['on'];
  this.offCommand	   = config['off'];
  this.stateCommand	 = config['state'];
  this.tempCommand	 = config['temp'];
  this.powerCommand	 = config['power'];
  this.onValue		   = config['on_value'];
  this.onValue	   	 = this.onValue.trim();
  this.exactMatch	   = config['exact_match'] || true;
  this.host          = config['host'];
  this.port          = config['port'];
  this.serial 			 = config['host'];
  this.displayName 	 = config['host'];
}

TcpAccessory.prototype.matchesString = function(match) {
  if(this.exactMatch) {
    return (match === this.onValue);
  } else {
    return (match.indexOf(this.onValue) > -1);
  }
}

TcpAccessory.prototype.setCurrentState = function(powerOn, callback) {
  var accessory = this;
  var state = powerOn ? 'on' : 'off';
  var prop = state + 'Command';
  var command = accessory[prop];
  var host = this.host;
  var port = this.port;
  var client = new net.Socket();
  client.connect(port, host, function() {
      var date = new Date();
      var curDate = null;
      do { curDate = new Date(); }
      while(curDate-date < 1000);
      accessory.log('CONNECTED TO: ' + host + ':' + port);
      accessory.log('Was it written? -' + client.write(command + '\n') + '- '+ command);
    });
  client.on('data', function(data) {
      accessory.log('DATA: ' + data.toString('utf-8').trim());
      // Close the client socket completely
      client.destroy();
  });
  client.on('close', function() {
    accessory.log('Set ' + accessory.name + ' to ' + state);
    callback(null);
  });
  client.on('error', function (err) {
    accessory.log('Error: ' + err);
    callback(err || new Error('Error setting ' + accessory.name + ' to ' + state));
  });
}

TcpAccessory.prototype.getCurrentState = function(callback) {
  var accessory = this;
  var command = accessory['stateCommand'];
  var host = this.host;
  var port = this.port;

	request('http://xtadmin:xt@192.168.192.41/AK_PS.XML?req=64830', function (error, response, body) {
		if (!error && response.statusCode == 200) {
			//accessory.log("Body: " + body);
			parseString(body, {
				explicitArray: false,
				mergeAttrs: true
			}, 
			function (err, result) {
				if (err) {
					accessory.log("Fehler: " + err);
				} else {

					var strStatus = JSON.stringify(result.AK_PS.STATUS).replace(' ', '').replace(/["']/g, "") === "ON" ? 1:0;
					var strWatt = JSON.stringify(result.AK_PS.WATT).replace(' ', '').replace(/["']/g, "");
					var strTemp = JSON.stringify(result.AK_PS.TEMP).replace(' ', '').replace(/["']/g, "");
				
					accessory.energyloggingService.addEntry({
						time: moment().unix(),
						temp: strTemp
					});

					//accessory.log("Result: " + JSON.stringify(result.AK_PS));
					//accessory.log("WATT: " + parseInt(strWatt) + 1);
					//accessory.log("TEMP: " + strTemp.replace(/[.]/g, ","));
					accessory.log("STATUS: " + parseInt(strStatus));
					callback(null, parseInt(strStatus));
				}
			});
			
		} else {
			accessory.log(error);
		}
	});
}

TcpAccessory.prototype.getCurrentTemp = function(callback) {
  var accessory = this;
  var command = accessory['tempCommand'];
  var host = this.host;
  var port = this.port;

	request('http://xtadmin:xt@192.168.192.41/AK_PS.XML?req=64830', function (error, response, body) {
		if (!error && response.statusCode == 200) {
			//accessory.log("Body: " + body);
			parseString(body, {
				explicitArray: false,
				mergeAttrs: true
			}, 
			function (err, result) {
				if (err) {
					accessory.log("Fehler: " + err);
				} else {

					var strStatus = JSON.stringify(result.AK_PS.STATUS).replace(' ', '').replace(/["']/g, "") === "ON" ? 1:0;
					var strWatt = JSON.stringify(result.AK_PS.WATT).replace(' ', '').replace(/["']/g, "");
					var strTemp = JSON.stringify(result.AK_PS.TEMP).replace(' ', '').replace(/["']/g, "").replace(/[.]/g, ",");
				
					accessory.energyloggingService.addEntry({
						time: moment().unix(),
						temp: strTemp
					});

					//accessory.log("Result: " + JSON.stringify(result.AK_PS));
					//accessory.log("WATT: " + parseInt(strWatt) + 1);
					accessory.log("TEMP: " + strTemp);
					//accessory.log("STATUS: " + parseInt(strStatus));
					callback(null, strTemp);
				}
			});
		} else {
			accessory.log(error);
		}
	});
}

TcpAccessory.prototype.getCurrentPower = function(callback) {
  var accessory = this;
  var command = accessory['powerCommand'];
  var host = this.host;
  var port = this.port;

	request('http://xtadmin:xt@192.168.192.41/AK_PS.XML?req=64830', function (error, response, body) {
		if (!error && response.statusCode == 200) {
			//accessory.log("Body: " + body);
			parseString(body, {
				explicitArray: false,
				mergeAttrs: true
			}, 
			function (err, result) {
				if (err) {
					accessory.log("Fehler: " + err);
				} else {

					var strStatus = JSON.stringify(result.AK_PS.STATUS).replace(' ', '').replace(/["']/g, "") === "ON" ? 1:0;
					var strWatt = JSON.stringify(result.AK_PS.WATT).replace(' ', '').replace(/["']/g, "");
					var strTemp = JSON.stringify(result.AK_PS.TEMP).replace(' ', '').replace(/["']/g, "");
				
					accessory.energyloggingService.addEntry({
						time: moment().unix(), 
						temp: strTemp
					});

					//accessory.log("Result: " + JSON.stringify(result.AK_PS));
					accessory.log("WATT: " + parseInt(strWatt) + 1);
					//accessory.log("TEMP: " + strTemp.replace(/[.]/g, ","));
					//accessory.log("STATUS: " + parseInt(strStatus));
					callback(null, parseInt(strWatt) + 1);
				}
			});
		} else {
			accessory.log(error);
		}
	});
}


TcpAccessory.prototype.updateStates = function(callback) {
  var accessory = this;
  var command = accessory['tempCommand'];
  var host = accessory.host;
  var port = accessory.port;
	
	request('http://xtadmin:xt@192.168.192.41/AK_PS.XML?req=64830', function (error, response, body) {
		if (!error && response.statusCode == 200) {
			//accessory.log("Body: " + body);
			parseString(body, {
				explicitArray: false,
				mergeAttrs: true
			}, 
			function (err, result) {
				if (err) {
					accessory.log("Fehler: " + err);
				} else {

					var strStatus = JSON.stringify(result.AK_PS.STATUS).replace(' ', '').replace(/["']/g, "") === "ON" ? 1:0;
					var strWatt = JSON.stringify(result.AK_PS.WATT).replace(' ', '').replace(/["']/g, "");
					var strTemp = JSON.stringify(result.AK_PS.TEMP).replace(' ', '').replace(/["']/g, "");
				
					accessory.energyloggingService.addEntry({
						time: moment().unix(), 
						temp: strTemp
						//temp: strTemp.replace(/[.]/g, ",")
					});
				
					accessory.switchService.getCharacteristic(Temperature).updateValue(strTemp);
					accessory.switchService.getCharacteristic(CurrentPowerConsumption).updateValue(strWatt);
					accessory.switchService.getCharacteristic(Characteristic.OutletInUse).updateValue(strStatus);
					
					//accessory.log("Result: " + JSON.stringify(result.AK_PS));
					accessory.log("WATT: " + parseInt(strWatt) + 1);
					accessory.log("TEMP: " + strTemp.replace(/[.]/g, ","));
					accessory.log("STATUS: " + parseInt(strStatus));
				}
			});
		} else {
			accessory.log(error);
		}
	});
	clearTimeout(accessory.timer);
	accessory.timer = setTimeout(function() {
		accessory.log('Time is Up!');
		accessory.updateStates();
	}, 300000);
}

TcpAccessory.prototype.setResetTotal = function (callback) {
	callback(null, 0);
};



TcpAccessory.prototype.getServices = function() {
  var informationService = new Service.AccessoryInformation();
  informationService
  .setCharacteristic(Characteristic.Manufacturer, 'AKNord')
  .setCharacteristic(Characteristic.Model, 'SecureSocketSwitch')
  .setCharacteristic(Characteristic.SerialNumber, '192.168.192.201')
	.setCharacteristic(Characteristic.FirmwareRevision, '0.0.2')
	.setCharacteristic(Characteristic.HardwareRevision, '0.0.2');

	this.energyloggingService = new FakeGatoHistoryService("weather", this, {
		disableTimer: true,
		storage: 'fs',
		path: _homebridge.user.storagePath()+'/fakegato/',
	});
	
	CurrentPowerConsumption = function () {
		Characteristic.call(this, 'Verbrauch', 'E863F10D-079E-48FF-8F27-9C2605A29F52');
		this.setProps({
			format: Characteristic.Formats.UINT16,
			unit: "Watt",
			maxValue: 100000,
			minValue: 0,
			minStep: 1,
			perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
		});
		this.value = this.getDefaultValue();
	};

	CurrentPowerConsumption.UUID = 'E863F10D-079E-48FF-8F27-9C2605A29F52';
	inherits(CurrentPowerConsumption, Characteristic);

	Temperature = function () {
		Characteristic.call(this, 'Temperature', '00000011-0000-1000-8000-0026BB765291');
		this.setProps({
			format: Characteristic.Formats.FLOAT,
			unit: "°C",
			maxValue: 100000000000,
			minValue: 0,
			minStep: 0.001,
			perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
		});
		this.value = this.getDefaultValue();
	};
	Temperature.UUID = '00000011-0000-1000-8000-0026BB765291';
	inherits(Temperature, Characteristic);
	
	ResetTotal = function () {
		Characteristic.call(this, 'Verbrauch zurücksetzen', 'E863F112-079E-48FF-8F27-9C2605A29F52');
		this.setProps({
			format: Characteristic.Formats.UINT32,
			perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY, Characteristic.Perms.WRITE]
		});
		this.value = this.getDefaultValue();
	};
	ResetTotal.UUID = 'E863F112-079E-48FF-8F27-9C2605A29F52';
	inherits(ResetTotal, Characteristic);
	
	this.switchService = new Service.Outlet(this.name);
	this.switchService
		.getCharacteristic(Characteristic.On)
		.on('get', this.getCurrentState.bind(this))
		.on('set', this.setCurrentState.bind(this));
		
	this.switchService
		.getCharacteristic(Characteristic.OutletInUse)
		.on('get', this.getCurrentState.bind(this));
	
	this.switchService.getCharacteristic(CurrentPowerConsumption)
		.on('get', this.getCurrentPower.bind(this));
	
	this.switchService.getCharacteristic(ResetTotal)
		.on('get', this.setResetTotal.bind(this));
	
	this.switchService.getCharacteristic(Temperature)
		.on('get', this.getCurrentTemp.bind(this));
	
	clearTimeout(this.timer);
	this.timer = setTimeout(function() {
		this.log('Time is Up!');
		this.updateStates();
	}.bind(this), 10000);
	
	return [informationService, this.switchService, this.energyloggingService];
}
