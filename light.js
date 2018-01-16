const config = require('./config');
const HomeKit = require('homekit');

const uuid = HomeKit.uuid.generate(config.uuid);
const acce = new HomeKit.Accessory(config.accessoryName, uuid);

const LifxClient = require('node-lifx').Client;
const client = new LifxClient();

acce.on('identify', (paired, cb) => {
  console.log("Identify!");
  cb();
});

client.init();

client.on('light-new', lifxBulb => {
  console.log('lifx light found!');

  const updateBulbColor = (newData, cb) => {
    console.log('set new value:', newData);
    lifxBulb.getState((err, originalData) => {
      const { hue, saturation, brightness } = Object.assign(originalData.color, newData);
      lifxBulb.color(hue, saturation, brightness, 3500, 0, cb);
    });
  };

  const getBulbColorData = (field, cb) => {
    lifxBulb.getState((err, data) => {
      console.log('get color data:', data.color);
      cb(err, data.color[field]);
    });
  };

  acce.addService(HomeKit.Service.Lightbulb, config.serviceName);

  acce
    .getService(HomeKit.Service.Lightbulb)
    .getCharacteristic(HomeKit.Characteristic.On)
    .on('set', (value, cb) => value ? lifxBulb.on(0, cb) : lifxBulb.off(0, cb))
    .on('get', cb => lifxBulb.getPower(cb));

  acce
    .getService(HomeKit.Service.Lightbulb)
    .addCharacteristic(HomeKit.Characteristic.Saturation)
    .on('set', (value, cb) => updateBulbColor({ saturation: value }, cb))
    .on('get', cb => getBulbColorData('saturation', cb));

  acce
    .getService(HomeKit.Service.Lightbulb)
    .addCharacteristic(HomeKit.Characteristic.Brightness)
    .on('set', (value, cb) => updateBulbColor({ brightness: value }, cb))
    .on('get', cb => getBulbColorData('brightness', cb));

  acce
    .getService(HomeKit.Service.Lightbulb)
    .addCharacteristic(HomeKit.Characteristic.Hue)
    .on('set', (value, cb) => updateBulbColor({ hue: value }, cb))
    .on('get', cb => getBulbColorData('hue', cb));

  // Publish the Accessory on the local network.
  acce.publish({
    port    : config.port,
    username: config.username,
    pincode : config.pincode
  });

});
