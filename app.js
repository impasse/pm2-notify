var os = require('os');
var Rx = require('rxjs');
var pm2 = require('pm2');
var pmx = require('pmx');
var request = require('request');

function buildMD(data) {
  if (data instanceof Array) {
    return data.map(buildMD).join('------\n');
  } else {
    return '**Name**: ' + data.process.name + '\n'
      + '**Host**: ' + os.hostname() + '\n'
      + '**Date**: _' + new Date(+data.at).toLocaleString() + '_\n'
      + (data.data.stack ? data.data.stack : data.data);
  }
}

pmx.initModule({}, function (err, conf) {

  var listenEvents = [];

  if(conf.process){
    listenEvents.push('process:exception');
  }
  if(conf.log){
    listenEvents.push('log:err');
  }

  pm2.launchBus(function (err, bus) {
    listenEvents.forEach(function (listenEvnet) {
      Rx.Observable.fromEvent(bus, listenEvnet)
        .filter(data => data.process.name !== conf.module_name)
        .bufferTime(conf.interval)
        .filter(dataArr => dataArr.length !== 0)
        .subscribe(function (dataArr) {
          request.post(conf.url, {
            form: {
              payload: JSON.stringify({ text: buildMD(dataArr) })
            }
          });
        });
    });
  });

});
