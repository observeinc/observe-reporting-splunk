import logging
import requests
import os
from datetime import datetime, timezone, timedelta
from time import strftime
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
        'query_name': 'Observe Splunk Reporting App',
        'dataset_id': None, #champ/sfdc_munge
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

# observe_query_api(tenant_id,obsv_site,tenant_tok)
def observe_query_api(tenant_id=None,obsv_site=None,tenant_tok=None,dataset_id=None,earliest_time=None,latest_time=None):
    if tenant_tok == None or tenant_id == None or obsv_site == None:
        return None

    logger = logging.getLogger('obsv_query')

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
    obsv_url = "https://{}.{}/v1/meta/export/query".format(tenant_id,obsv_site)
    obsv_api_key = "Bearer {} {}".format(tenant_id,tenant_tok)
    # ingest token
    #btok =  get_o2_ingest_key()

    # set up headers for O2 auth
    headers = {"Authorization": obsv_api_key}
    # check for earliest latest time, otherwise default to last 24
    if earliest_time == None or latest_time == None:
        today = datetime.now(timezone.utc).date()
        yesterday = today - timedelta(days=1)
        start_time = datetime.combine(today, datetime.max.time(), timezone.utc)
        end_time = datetime.combine(yesterday, datetime.min.time(), timezone.utc)
        query_params = obs_query_params
        # example resulting valid timestamp format
        # 2024-03-05T23:59:59.999999+00:00
        query_params['startTime'] = end_time.isoformat()
        query_params['endTime'] = start_time.isoformat()
        logger.debug("OBSERVE ST: {}\nET:{}".format(query_params['startTime'],query_params['endTime']))
        #{"ok":false,"message":"invalid startTime \"2024-03-04T04:00:00\": parsing time \"2024-03-04T04:00:00\" as \"2006-01-02T15:04:05Z07:00\": cannot parse \"\" as \"Z07:00\""}
    
    else:
        query_params = obs_query_params
        # example splunk timestamp: 
        # earl = 1709510400.0
        # datetime.utcfromtimestamp(1709510400.0).isoformat()
        sT = datetime.utcfromtimestamp(earliest_time)
        sT = sT.replace(tzinfo=timezone.utc)
        eT = datetime.utcfromtimestamp(latest_time)
        eT = eT.replace(tzinfo=timezone.utc)
        query_params['startTime'] = sT.isoformat()
        query_params['endTime'] = eT.isoformat()
        logger.debug("OBSERVE ST: {}\nET:{}".format(query_params['startTime'],query_params['endTime']))


    # we're using the dataset defined on /lib/observe_consts/o2_query_usage_sandbox
    # since its an array of 1, lets just go with
    o2_query = query_example[0]
    
    # Update the dataset ID and pipeline in the query params
    obs_request_body['query']['stages'][0]['input'][0]['datasetId'] = dataset_id#formerly o2_query['dataset_id']
    obs_request_body['query']['stages'][0]['pipeline'] = o2_query['pipeline']
    obs_request_body['rowCount'] = "50000" 

    logger.debug("------------Making API Request to Observe------------")
    logger.debug("------------{}------------".format(o2_query['query_name']))
    # Make the API call
    response = requests.post(obsv_url, headers=headers, params=query_params, json=obs_request_body)

    # Check the response status code and content
    if response.status_code >= 400 and response.status_code < 500:
        logger.error("OBSERVE: Authentication Error With Observe API")
        logger.error("OBSERVE: Response Dump: {}".format(response.text))
        logger.debug("OBSERVE: o2 status code response and body\n{}\n{}".format(response.status_code, response.text))
        message = "Error communicating with Observe: {}. See Search Log For More Info".format(response.status_code)
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

# observe_query_api(tenant_id,obsv_site,tenant_tok)
def observe_query_datasets(tenant_id=None,obsv_site=None,tenant_tok=None):
    if tenant_tok == None or tenant_id == None or obsv_site == None:
        return None

    logger = logging.getLogger('obsv_query')

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
    obsv_url = "https://{}.{}/v1/dataset/".format(tenant_id,obsv_site)
    obsv_api_key = "Bearer {} {}".format(tenant_id,tenant_tok)
    # ingest token
    #btok =  get_o2_ingest_key()

    # set up headers for O2 auth
    headers = {"Authorization": obsv_api_key}

    # Make the API call
    response = requests.get(obsv_url, headers=headers)

    # Check the response status code and content
    if response.status_code >= 400 and response.status_code < 500:
        logger.error("OBSERVE: Authentication Error With Observe API")
        logger.debug("OBSERVE: o2 status code response and body\n{}\n{}".format(response.status_code, response.text))
        message = "Error communicating with Observe: {}. See Search Log For More Info".format(response.status_code)
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
