# Introduction

Repository contains postman collection for testing an URL which is secured by oAuth. We need to get a bearer token for accessing the URL. 

<br /> 

## Setup

The folder `newman` contains a dicker file and the collections for running a docker container locally and natively with Newman. The folder `nodejs´ contains a small application for doing the same stuff. The difference is that the NodeJS App provides a prometheus extension for scraping endpoints / executing postman tests regularly and providing the specific metrics.

<br /> 

### Run Newman Docker Image locally 

Go to `newman` folder an execute following command:  
`docker build -t mrmyiagi/postman_runner .`

<br /> 

Run the built container by using following command:  
`docker run mrmyiagi/postman_runner run test/PARTER_URL_TEST.postman_collection.json --insecure --env-var "CLIENT_ID=1234" --env-var "CLIENT_SECRET=1234" --env-var "SSO_URL=sso_url.com" --env-var "PARTNER_URL=https://partner_url.com"--environment="environment/ENVIRONMENT.postman_environment.json" --reporters cli --reporter-cli-no-failures`

<br /> 


### Run Docker Image with NodJS

For running the tests in Kubernetes we create a NodeJS in which we run the test collection with a prometheus extension where we can publish metrics. 


