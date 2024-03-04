#!/usr/bin/env python
import sys
import os
import logging
import time
import json

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "libs"))
from splunklib.searchcommands import \
    dispatch, GeneratingCommand, Configuration, Option, validators
from observe_helpers import observe_query_api, get_tenant, get_token

logger = logging.getLogger('obsv_query')
logger.setLevel(os.environ.get('log_level',"DEBUG"))

@Configuration()
class GeneratingCSC(GeneratingCommand):
    """
    The generatingcommand returns data from Observe in 5k chunks

    Example:

    ``| obsv dataset={datasetId}``

    Returns up to 5k records from a dataset
    """


    def generate(self):

        # To connect with Splunk, use the instantiated service object which is created using the server-uri and
        # other meta details and can be accessed as shown below
        # Example:-
        #    service = self.service
        #    info = service.info //access the Splunk Server info

        logger.error("Fetching tenant info")
        session_key= self._metadata.searchinfo.session_key
        obsv_ten = get_tenant(session_key=session_key)
        if obsv_ten == None:
            logger.error("Error fetching observe conf info")
            yield {'_time':time.time(),'_raw':"Error communicating with Splunk conf system"}
        else:
            ten_resp = json.loads(obsv_ten.decode('utf-8'))
            tenant_id = ten_resp['entry'][0]['content']['tenant_id']
            obsv_token = get_token(session_key=session_key,tenant_id=tenant_id)
            tok_resp = json.loads((obsv_token.decode('utf-8')))
            logger.debug(json.dumps(tok_resp))
            tenant_tok = tok_resp['entry'][0]['content']['clear_password']
        logger.debug("Generating %s events from Observe")
        response = observe_query_api(tenant_id,tenant_tok)
        self.logger.debug(str(response))
        if response == None:
            yield {'_time':time.time(),'_raw':"Error communicating with Observe, see search.log in search inspector"}
        if type(response) is str:
            yield {'_time':time.time(),'_raw':response}
        else:
            for line in response.iter_lines():
                if line:
                #load the JSON response
                    json_obj = json.loads(line)
                #logger.debug("Response From O2: \n{}".format(line))
                #example on how to handle the max_time field in our response
                    if 'inputType' in json_obj:
                        source = json_obj['inputType']
                    else:
                        source = "observe_generic"
                    yield {'_time': time.time(), 'sourcetype':'observe','source': source,'_raw': json_obj}


dispatch(GeneratingCSC, sys.argv, sys.stdin, sys.stdout, __name__)
