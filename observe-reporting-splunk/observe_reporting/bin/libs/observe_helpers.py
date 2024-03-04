import logging
import requests
import os
import traceback
import base64
import json
from datetime import datetime, timezone, timedelta
import sys
import splunk.rest as sr


# Set the list of known datasets to query with associated pipeline
# Set the request body
obs_request_body = {
        'query': {
            'stages': [
            {
                'input': [
                {
                    'inputName': 'main',
                    'datasetId': ''
                }
                ],
                'stageID': 'stage',
                'pipeline': ''
            }
            ],
            'parameters' : [],
            'parameterValues' : []
        },
        'rowCount': '5000'
        }

# Set the query parameters
obs_query_params = {
      'startTime': None,
      'endTime': None
}



query_example = [
    {
        'query_name': 'CHAMP_SFDC_Data_w_Emails',
        'dataset_id': '41028873', #champ/sfdc_munge
        'pipeline': '''
        '''
    }
]

def get_tenant(session_key=None):
    if session_key == None:
        return None
    # /services/configs/conf-{file}/{stanza}
    url = "/servicesNS/nobody/observe_reporting/configs/conf-observe/observe_environment"
    resp = sr.simpleRequest(path=url,sessionKey=session_key,getargs={"output_mode":"json"})
    return resp[1]

def get_token(session_key=None,tenant_id=None):
    if session_key == None or tenant_id == None:
        return None
    # /servicesNS/nobody/secret_storage_test/storage/passwords/realm1:user1
    url = "/servicesNS/nobody/observe_reporting/storage/passwords/Observe:"+tenant_id
    resp = sr.simpleRequest(path=url,sessionKey=session_key,getargs={"output_mode":"json"})
    return resp[1]

def observe_query_api(tenant_id=None,tenant_tok=None):
    if tenant_tok == None or tenant_id == None:
        return None

    logger = logging.getLogger('obsv_query')
    logger.setLevel(os.environ.get('log_level',"DEBUG"))

    # set up our vert specific SFDC date math
    # MM/dd/yyyy HH:mm:ss is ideal, but probably not possible
    # due to 
    #sfdc_dt_format = '%m/%d/%y %H:%M:%S'
    #sfdc_dt_format = '%m/%d/%y %H:%M:%S'
    # const for converting nano seconds to regular ole seconds
    nano_to_sec = 1000000000
    # Ignore some of the above...
    # https://stackoverflow.com/questions/2150739/iso-time-iso-8601-in-python
    # marc benioff is an ass hat
    # datetime.datetime.utcnow().isoformat()
    # CHANGE THESE TO BE CONF SETTINGS, PASSWORDS.CONF and CuSTOM CONF
    obsv_url = "https://{}.observeinc.com/v1/meta/export/query".format(tenant_id)
    obsv_api_key = "Bearer {} {}".format(tenant_id,tenant_tok)
    # ingest token
    #btok =  get_o2_ingest_key()

    # set up headers for O2 auth
    headers = {"Authorization": obsv_api_key}
    today = datetime.now(timezone.utc).date()
    yesterday = today - timedelta(days=1)
    start_time = datetime.combine(today, datetime.max.time(), timezone.utc)
    end_time = datetime.combine(yesterday, datetime.min.time(), timezone.utc)

    query_params = obs_query_params
    query_params['startTime'] = end_time.isoformat()
    query_params['endTime'] = start_time.isoformat()
    logger.debug("ST: {}\nET:{}".format(query_params['startTime'],query_params['endTime']))

    # we're using the dataset defined on /lib/observe_consts/o2_query_usage_sandbox
    # since its an array of 1, lets just go with
    o2_query = query_example[0]
    
    # Update the dataset ID and pipeline in the query params
    obs_request_body['query']['stages'][0]['input'][0]['datasetId'] = o2_query['dataset_id']
    obs_request_body['query']['stages'][0]['pipeline'] = o2_query['pipeline']

    logger.debug("------------Making API Request to Observe------------")
    logger.debug("------------{}------------".format(o2_query['query_name']))
    # Make the API call
    response = requests.post(obsv_url, headers=headers, params=query_params, json=obs_request_body)

    # Check the response status code and content
    if response.status_code >= 400 and response.status_code < 500:
        logger.error("Authentication Error With Observe API")
        logger.debug("o2 status code response and body\n{}\n{}".format(response.status_code, response.text))
        message = "Error communicating with Observe: {}".format(response.status_code)
        return message
    if response.status_code == requests.codes.ok:
    # Parse the NDJSON response
        """
        # BELOW IS OLD CODE - we'll just return the NDJSON resp to caller of function
        for line in response.iter_lines():
            if line:
                #load the JSON response
                json_obj = json.loads(line)
                logger.debug("Response From O2: \n{}".format(line))
                #example on how to handle the max_time field in our response
        """
        return response      
