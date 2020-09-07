const SHT31 = require('raspi-node-sht31')
const io = require('socket.io-client')

function readSHT31(opts) {
	var opts = opts || {}
	return new Promise((resolve, reject) => {
		const sht31 = new SHT31(opts.address, opts.bus)
		sht31.readSensorData()
		.then((data) => {
			var unitData = 0
			if (opts.unit === 'kelvin') {
				unitData = data.temperature * 1 + 273
			} else if (opts.unit === 'reamur') {
				unitData = data.temperature * 0.8
			} else if (opts.unit === 'fahrenheit') {
				unitData = data.temperature * 1.8 + 32
			} else {
				unitData = data.temperature * 1
			}
			const temp = Math.round(unitData)
			const humidity = Math.round(data.humidity)
			resolve({
				temperature: temp,
				humidity: humidity
			})
		})
		.catch((err) => {
			// console.error(err)
			reject(err)
		})	
	})
}

const socket = io('http://127.0.0.1:50105')
var config = {
	address: 0x44,
	bus: 1,
	unit: 'celcius',
	interval: 5000
}
socket.on('connect', function () {
	socket.emit('client', 'pandaya-sht31')
	socket.on('config', (opts) => {
		console.log('Opts: ', opts)
		config.address = parseInt(opts.address) || config.address
		config.bus = Number(opts.bus) || config.bus
		config.unit = opts.unit || config.unit
		config.interval = opts.interval || config.interval
	})
	setInterval(function () {
		readSHT31({
			address: config.address,
			bus: config.bus,
			unit: config.unit
		})
		.then((data) => {
			// console.log('Timestamp: ' + new Date().getTime())
			// console.log('Temperature is: ' + data.temperature.toString())
			// console.log('Humidity is: ' + data.humidity.toString())
			socket.emit('data', {
				timestamp: new Date().getTime(),
				data: {
					temperature: data.temperature,
					humidity: data.humidity
				}
			})
		})
		.catch((err) => {
			console.error(err)
		})
	}, config.interval)
})
socket.on('disconnect', function () {
	console.log('Disconnected from Main Process')
})


