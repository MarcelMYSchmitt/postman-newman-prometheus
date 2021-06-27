var express = require("express");
const kubeProbe = require('kube-probe');
const promClient = require('prom-client');
var request = require('request');
var sleep = require('system-sleep');


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

const URL = process.env.SSO_URL;
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
    CallEndpointAndSetAvailabilityMetric();
    sleep(10000);
}


// CHECK ENV VARIABLES
function checkIfNullOrEmpty(parameterName, parameterValue) {
    if (!parameterValue) {
        throw new Error(`${parameterName} is null or empty!`);
    }

    console.log(`${parameterName}: ${parameterValue}`);
}


function CallEndpointAndSetAvailabilityMetric() {


    try {

        newman run PARTER_URL_TEST.postman_collection.json--environment = "environment/ENVIRONMENT.postman_environment.json"
        console.log("Set Status of Metric to 1");

        gauge.set(1);

    } catch {

        console.log("Set Status of Metric to 0");

        gauge.set(0);
    }
}