
var http = require('http'),
    argv = require('optimist').argv;

function usage() {
  console.log('node proxy.js [options]');
  console.log('options :');
  console.log('  --proxy_http_port port : proxy http port, default value 8079');
  console.log('  --proxy_http_address address : proxy http address, default value 0.0.0.0');
  console.log('  --influxdb_host : influxdb host, default value localhost');
  console.log('  --influxdb_port : influxdb port, default value 8086');
  console.log('  --influxdb_db : influxdb db');
  console.log('  --influxdb_user : influxdb user');
  console.log('  --influxdb_password : influxdb password');
  console.log('  --verbose : display metric name pushed into influxdb');
  console.log('  --help : this help');
  process.exit(1);
}

if (argv.help) {
  usage();
}

if (!argv.proxy_http_port) {
  argv.proxy_http_port = 8079;
}

if (!argv.proxy_http_address) {
  argv.proxy_http_address = '0.0.0.0';
}

if (!argv.influxdb_host) {
  argv.influxdb_host = 'localhost';
}

if (!argv.influxdb_port) {
  argv.influxdb_port = '8086';
}

if (!argv.influxdb_db) {
  console.log('Missing param : influxdb_db');
  usage();
}

if (!argv.influxdb_user) {
  console.log('Missing param : influxdb_user');
  usage();
}

if (!argv.influxdb_password) {
  console.log('Missing param : influxdb_password');
  usage();
}

argv.influxdb_path = '/db/' + argv.influxdb_db + '/series?u=' + argv.influxdb_user + '&p=' + argv.influxdb_password + '&time_precision=s';
console.log('Influx db config');
console.log('Host :', argv.influxdb_host, ':', argv.influxdb_port);
console.log('Path :', argv.influxdb_path);

var server = http.createServer(function(req, res) {
  var data = '';
  req.on('data', function(chunk) {
    data = data + chunk.toString();
  });
  req.on('end', function() {
    res.writeHead(200);
    res.end();

    var output = [];
    var parsed = JSON.parse(data);
    parsed.forEach(function(x) {
      var name = x.host + '.' + x.plugin;
      if (x.plugin_instance !== '') {
        name = name + '.' + x.plugin_instance;
      }
      name = name + '.' + x.type;
      if (x.type_instance !== '') {
        name = name + '.' + x.type_instance;
      }
      for(var z in x.dstypes) {
        if (x.dstypes[z] == 'counter' || x.dstypes[z] == 'gauge') {
          var n = name + '.' + x.dsnames[z];
          if (argv.verbose) {
            console.log('Push metric', n);
          }
          output.push({
            name: n,
            columns: ['time', 'value'],
            points: [[x.time, x.values[z]]],
          });
        }
      }
    });
    var forwarded_req = {
      hostname: argv.influxdb_host,
      port: argv.influxdb_port,
      path: argv.influxdb_path,
      method: 'POST'
    };
    var r = http.request(forwarded_req, function(rr) {
      if (rr.statusCode != "200") {
        console.error('Request refused by influx db', rr.statusCode);
      }
    });

    r.on('error', function(e) {
      console.log('problem with request: ' + e.message);
    });
    r.write(JSON.stringify(output));
    r.end();
  });
});

server.listen(argv.proxy_http_port, argv.proxy_http_address);

console.log('Proxy started on port', argv.proxy_http_port, 'ip', argv.proxy_http_address);

