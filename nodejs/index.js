var express = require("express");
const kubeProbe = require('kube-probe');
const promClient = require('prom-client');
var request = require('request');
var sleep = require('system-sleep');
const newman = require('newman');



/*
#########################################################

Example HTTP SERVER

#########################################################
*/

var app = express();
var router = express.Router();

var path = __dirname + '/';

router.use(function(req, res, next) {
    console.log("/" + req.method);
    next();
});

router.get("/", function(req, res) {
    res.sendFile(path + "index.html");
});

app.use(express.static(path));
app.use("/", router);

app.listen(8080, function() {
    console.log('HTTP Web Server is running on internal port 8080!')
})


/*
#########################################################

MONITORING SERVER
https://github.com/siimon/prom-client


#########################################################
*/

const SSO_URL = process.env.SSO_URL;
checkIfNullOrEmpty('SSO_URL', SSO_URL);

const CLIENT_ID = process.env.CLIENT_ID;
checkIfNullOrEmpty('CLIENT_ID', CLIENT_ID);

const CLIENT_SECRET = process.env.CLIENT_SECRET;
checkIfNullOrEmpty('CLIENT_SECRET', CLIENT_SECRET);

const PARTNER_URL = process.env.PARTNER_URL;
checkIfNullOrEmpty('PARTNER_URL', PARTNER_URL);

const metricServer = express();
const register = new promClient.Registry();

const gauge = new promClient.Gauge({ name: 'PARTNER_URL_TEST', help: 'Shows Availability of Endpoint.' });
register.registerMetric(gauge);

metricServer.get('/metrics', (req, res) => {
    res.set('Content-Type', register.contentType);
    res.end(register.metrics());
});


console.log('Server listening to 3001, metrics exposed on "/metrics" endpoint');
metricServer.listen(3001)

/*
#########################################################

LIVENESS AND READINESS PROBES IN K8S
https://github.com/nodeshift/kube-probe

#########################################################
*/

const options = {
    readinessURL: '/health/readiness',
    livenessURL: '/health/liveness'
}

console.log('Server listening to 3001, liveness and readiness exposed via "/health/readiness" and "/health/liveness" endpoints');
kubeProbe(metricServer, options);

while (1) {
    ExecutePostmanTestAndSetAvailabilityMetric();
    sleep(10000);
}


// CHECK ENV VARIABLES
function checkIfNullOrEmpty(parameterName, parameterValue) {
    if (!parameterValue) {
        throw new Error(`${parameterName} is null or empty!`);
    }

    console.log(`${parameterName}: ${parameterValue}`);
}



// EXECUTE POSTMAN TEST
function ExecutePostmanTestAndSetAvailabilityMetric() {

    try {
        console.log('Starting postman scripts: ');

        // check if proxy setting is needed! 
        //const SocksProxyAgent = require('socks-proxy-agent');
        //const requestAgent = new SocksProxyAgent({ host: 'add_proxy_url', port: 'add_proxy_port' });

        newman.run({
                collection: require('./test/PARTER_URL_TEST.postman_collection.json'),
                environment: {
                    "id": "9904cbd9-1c54-4a94-9576-d739dbd925ff",
                    "name": "ENVIRONMENT",
                    "values": [{
                            "key": "SSO_URL",
                            "value": SSO_URL,
                            "enabled": true
                        },
                        {
                            "key": "CLIENT_ID",
                            "value": CLIENT_ID,
                            "enabled": true
                        },
                        {
                            "key": "CLIENT_SECRET",
                            "value": CLIENT_SECRET,
                            "enabled": true
                        },
                        {
                            "key": "ACCESS_TOKEN",
                            "value": "",
                            "enabled": true
                        },
                        {
                            "key": "PARTNER_URL",
                            "value": PARTNER_URL,
                            "enabled": true
                        }
                    ],
                    "_postman_variable_scope": "environment"
                },
                //requestAgents: {
                //http: requestAgent, // agent used for HTTP requests
                //http: requestAgent, // agent used for HTTPS requests
                //},
                reporters: 'cli'
            },
            function(err) {
                if (err) { throw err; }
                console.log('collection run complete!');
            });

        console.log("Set Status of Metric to 1");

        gauge.set(1);

    } catch {

        console.log("Set Status of Metric to 0");

        gauge.set(0);
    }
}