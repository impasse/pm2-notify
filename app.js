var os = require('os');
var _ = require('lodash');
var pm2 = require('pm2');
var pmx = require('pmx');
var request = require('request');

function buildMD(data) {
  return '# ' + data.process.name + '\n'
    + '*time*: ' + new Date(+data.at).toString() + '\n'
    + '**message**: ' + data.data.message + '\n'
    + '**stack**: ' + data.data.stack + '\n';
}

pmx.initModule({
}, function (err, conf) {

  var listenEvents = [
    // 'log:err',
    'process:exception',
  ];

  pm2.launchBus(function (err, bus) {
    listenEvents.forEach(function (listenEvnet) {
      bus.on(listenEvnet, _.debounce(function (data) {
        if (data.process.name !== 'pm2-notify') {
          request.post(conf.url, {
            form: {
              payload: buildMD(data),
            }
          });
        }
      }, 150));
    });
  });

});
