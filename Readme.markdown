Collectd-influxdb-proxy
---

Small proxy between collectd and influxdb.

On collectd side, add following plugin

    LoadPlugin "write_http"
    <Plugin "write_http">
      <Node "example">
        URL "http://10.0.0.130:8079"
        Format "JSON"
      </Node>
    </Plugin>

Where 10.0.0.130:8079 is the listening point of your collectd-influxdb proxy.

To start the proxy

    node proxy.js --influxdb_db mydb --influxdb_user myuser --influxdb_password mypassword

Where mydb, myuser and myspassword are connection parameter to Influxdb. By default, collectd-influxb-proxy assume influxdb is deployed on the same server.

Other collectd-influxdb-proxy :

    node proxy.js [options]
    options :
      --proxy_http_port port : proxy http port, default value 8079
      --proxy_http_address address : proxy http address, default value 0.0.0.0
      --influxdb_host : influxdb host, default value localhost
      --influxdb_port : influxdb port, default value 8086
      --influxdb_db : influxdb db
      --influxdb_user : influxdb user
      --influxdb_password : influxdb password
      --verbose : display metric name pushed into influxdb
      --help : this help

Note : only ``gauge`` and ``counter`` metrics from Collectd are processed, and are transmitted as is to Influxdb.
