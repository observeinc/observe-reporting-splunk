import React, { useState, useEffect } from 'react';
import Button from '@splunk/react-ui/Button';
import Heading from '@splunk/react-ui/Heading';
import Markdown from '@splunk/react-ui/Markdown';
import List from '@splunk/react-ui/List';
import Link from '@splunk/react-ui/Link';
import Text from '@splunk/react-ui/Text';
import ColumnLayout from '@splunk/react-ui/ColumnLayout';
import { defaultFetchInit, handleResponse } from '@splunk/splunk-utils/fetch';
// import { defaultFetchInit, handleResponse, handleError } from '@splunk/splunk-utils/fetch';

const passwordsEndpoint =
    '/en-US/splunkd/__raw/servicesNS/nobody/observe_reporting/storage/passwords';

const observeConfEndpoint =
    '/en-US/splunkd/__raw/servicesNS/nobody/observe_reporting/configs/conf-observe/observe_environment';

async function updateAppConf() {
    // function to update app.conf is_configured property to true when password is successfully added

    const fetchInit = defaultFetchInit; // from splunk-utils API
    fetchInit.method = 'POST';
    const n = await fetch(
        '/en-US/splunkd/__raw/servicesNS/nobody/system/apps/local/observe_reporting',

        {
            ...fetchInit,
            body: 'configured=true', // update the configured property
        }
    );

    return n;
}

async function getObserveTenant() {
    // function to update app.conf is_configured property to true when password is successfully added

    const fetchInit = defaultFetchInit; // from splunk-utils API
    fetchInit.method = 'GET';
    const n = await fetch(`${observeConfEndpoint}?output_mode=json`, {
        ...fetchInit,
    }).then(handleResponse(200));
    console.log(JSON.stringify(n));

    try{
        return n.entry[0].content.tenant_id;

    } catch (error) {
        return "";
    }


}

async function updateObserveConf(tenant_id,observe_site) {
    // function to update app.conf is_configured property to true when password is successfully added

    const fetchInit = defaultFetchInit; // from splunk-utils API
    fetchInit.method = 'POST';
    const n = await fetch(
        `${observeConfEndpoint}`,
        {
            ...fetchInit,
            body: new URLSearchParams( 
            {'tenant_id' : tenant_id,
             'observe_site': observe_site
            } 
            )
        }
    );

    return n;
}
// Markdown for our stuff
const helpText = `
## App Overview
This Splunk app provides a way to query the Observe REST API via a custom search command.
In order to successfully connect Splunk with Observe; please enter your 12 digit Observe tenant ID, your Observe tenant's site (observeinc.com, ap-1.observeinc.com, eu-1.observeinc.com. etc )
as well as an API token that has query permissions.

When configured you can use the custom search command obsv to query specific datasets by their ID. For example:

\`|obsv datasetId="123456"\`

This returns up to 50,000 results total. Max results can be adjusted via Splunk's \`limits.conf\` setting for \`maxresultrows\`, under the \`[searchresults]\` stanza.

### Helper Commands
You can use \`|obsvds\` to grab a list of datasets. Try using subsearch to return the dataset ID into the core \`| obsv\` command:

\`\`\`
| obsv [
    | obsvds | spath
    | stats count by meta.id, config.name  
    | search config.name="kubernetes/Container Logs"
    | rex field=meta.id "dataset:(?<dataset_id>\\d{5,10}$)"
    | return datasetId=$dataset_id 
]
\`\`\`

`;


/* Function to create a Password */
async function createPassword(password,tenant_id) {
    const fetchInit = defaultFetchInit; // from splunk-utils API
    fetchInit.method = 'POST';
    const realm = 'Observe';
    const user = tenant_id;

    const n = await fetch(`${passwordsEndpoint}`, {
        ...fetchInit,
        body: `name=${user}&password=${password}&realm=${realm}`, // put password into passwords.conf
    });
    if (n.status == 409) {
        const resp = updatePassword(password);
        return resp;
    }
    else {
        return n;
    }


}


/* Function to create a Password */
async function createIngestPassword(ingest_password,tenant_id) {
    const fetchInit = defaultFetchInit; // from splunk-utils API
    fetchInit.method = 'POST';
    const realm = 'ObserveIngest';
    const user = tenant_id;

    const n = await fetch(`${passwordsEndpoint}`, {
        ...fetchInit,
        body: `name=${user}&password=${ingest_password}&realm=${realm}`, // put password into passwords.conf
    });
    if (n.status == 409) {
        const resp = updateIngestPassword(password);
        return resp;
    }
    else {
        return n;
    }


}

async function updatePassword(password) {
    const fetchInit = defaultFetchInit; // from splunk-utils API
    const tid = await getObserveTenant();
    fetchInit.method = 'POST';
    const realm = 'Observe';
    const user = tid;

    const n = await fetch(`${passwordsEndpoint}/${realm}:${user}`, {
        ...fetchInit,
        body: `password=${password}`, // put password into passwords.conf
    });
    return n;
}

async function updateIngestPassword(password) {
    const fetchInit = defaultFetchInit; // from splunk-utils API
    const tid = await getObserveTenant();
    fetchInit.method = 'POST';
    const realm = 'ObserveIngest';
    const user = tid;

    const n = await fetch(`${passwordsEndpoint}/${realm}:${user}`, {
        ...fetchInit,
        body: `password=${password}`, // put password into passwords.conf
    });
    return n;
}

async function enableLookupGen(){
    const ssurl = `/en-US/splunkd/__raw/servicesNS/Nobody/observe_reporting/configs/conf-savedsearches/LookupGen-Observe_Dataset_Meta`
    const searchurl = `/en-US/splunkd/__raw/servicesNS/Nobody/observe_reporting/search/jobs`
    const searchString = `| from savedsearch:"LookupGen-Observe_Dataset_Meta"`
    const fetchInit = defaultFetchInit; // from splunk-utils API
    const enable = 1
    fetchInit.method = 'POST';
    const n = await fetch(ssurl, {
        ...fetchInit,
        body: `enableSched=${enable}`, // enable scheduler for saved search
    });
    const n1 = await fetch(searchurl, {
        ...fetchInit,
        body: `search=${searchString}`, // run a search
    });
    return [n,n1];


}

const SetupComponent = () => {
    // create state variables using state hooks

    const [password, setPassword] = useState();
    const [ingest_password,setIngestPassword] = useState();
    const [tenant_id, setTenant] = useState();
    const [observe_site_id,setSite] = useState();
    const [isValid, setValid] = useState(false);
    const [loaded_pass,loadPasswords] = useState("");
    const [loaded_tenant,loadObserveConf] = useState("");
    const [loaded_site,loadObserveSite] = useState("");
 

    useEffect(() => {
        async function getObserveConf() {
            // function to update app.conf is_configured property to true when password is successfully added
        
            const fetchInit = defaultFetchInit; // from splunk-utils API
            fetchInit.method = 'GET';
            const n = await fetch(`${observeConfEndpoint}?output_mode=json`, {
                ...fetchInit,
            }).then(handleResponse(200));

            try{
                var tenant_id = n.entry[0].content.tenant_id;
                var obsv_site_id = n.entry[0].content.observe_site;
                console.log(`Observe Tenant Found ${tenant_id} and Observe Site Found ${obsv_site_id}`);
                //return resp;
                loadObserveConf(tenant_id);
                loadObserveSite(obsv_site_id);
            } catch (error) {
                //return "";
                loadObserveConf("");
                loadObserveSite("");
            }


        }
        
        async function getPasswords() {
            // this function can be used to retrieve passwords if that becomes necessary in your app
             const fetchInit = defaultFetchInit; // from splunk-utils API
             fetchInit.method = 'GET';
             const n = await fetch(`${passwordsEndpoint}?output_mode=json`, {
                 ...fetchInit,
             }).then(handleResponse(200));
             try{
                var resp = n.entry[0].content.clear_password;
                console.log(`Observe API Key Found. Run the following search to see it in clear text`);
                console.log(`| rest /servicesNS/nobody/observe_reporting/storage/passwords/ | stats count by realm, username, clear_password`);
                return loadPasswords(resp);
                //return resp;
            } catch (error) {
                //return "";
                return loadPasswords("");
            }
         }
         getObserveConf();
         getPasswords();
         console.log()

    },[]);


    const passwordClick = () => {
        if (isValid) {
            createPassword(password,tenant_id).then((response) => {
                // check if query API key is stored successfully
                if (response.status >= 200 && response.status <= 299) {
                    createIngestPassword(ingest_password,tenant_id).then((response) => {
                    // check if ingest key was successfully stored successfully
                        if (r.status >= 200 && r.status <= 299) {
                            updateAppConf().then((r) => {
                                // update app.conf
                                if (r.status >= 200 && r.status <= 299) {
                                    // if app.conf is successfully updated, then reload the page
                                    updateObserveConf(tenant_id,observe_site_id).then((r) => {
                                        if (r.status >= 200 && r.status <= 299) { 
                                            enableLookupGen().then(() =>  {
                                                if(r.status >= 200 && r.status <= 299){
                                                window.location.href = '/app/observe_reporting/search?q=%7C%20obsvds%20%7C%20spath%20%7C%20stats%20count%20by%20meta.id%2C%20config.name';
                                                }
                                            });
                                        };
                                    });
                                    
                                }
                            });
                        }
                    });          
                } else {
                    console.log('error');
                }
            });
        }
    };
    // basically primitive validation.
    const handleUserInput = (event) => {
        // add password input error handling here
        if (event.target.value.length > 5) {
            setValid(true);
        } else {
            setValid(false);
        }
    };

    return (
        // create the UI for the Setup Page
        <>
            <div>
                <div>
                    <Heading level={1}>Welcome to the Observe App for Splunk</Heading>
                    <ColumnLayout divider="vertical">
                        <ColumnLayout.Row>
                            <ColumnLayout.Column span={6}>
                                <div className="left">
                                <Markdown text={helpText} />
                                    <img 
                                    src="https://www.observeinc.com/wp-content/uploads/2024/02/O11y-observability-cloud_9f967e.png"
                                    alt="new"
                                    />
                                </div>
                            </ColumnLayout.Column>
                            <ColumnLayout.Column span={6}>
                                <div className="right">
                                    <Heading level={2}>App Setup</Heading>
                                    <br></br>
                                    <b>Note: The API Token is different from an Ingest Token!</b>
                                    <div className="field tenant_id">
                                        <div className="title">
                                            <Heading level={3}>Observe Tenant ID:</Heading>
                                            Please specify your Observe Tenant ID
                                        </div>
                                        <Text
                                            inline
                                            type="text"
                                            placeholder={loaded_tenant}
                                            value={tenant_id}
                                            onChange={(e) => {
                                                setTenant(e.target.value); // store the tenant
                                                handleUserInput(e);
                                            }}
                                        />
                                    </div>
                                    <div className="field observe_site">
                                        <div className="title">
                                            <Heading level={3}>Observe Site:</Heading>
                                            Please specify your Observe site
                                        </div>
                                        <Text
                                            inline
                                            type="text"
                                            placeholder={loaded_site}
                                            value={observe_site_id}
                                            onChange={(e) => {
                                                setSite(e.target.value); // store the site
                                                handleUserInput(e);
                                            }}
                                        />
                                    </div>
                                    <div className="field api_key">
                                        <div className="title">
                                            <Heading level={3}>Observe API Token:</Heading>
                                            Please specify the API token for your Observe tenant
                                        </div>
                                        <Text
                                            inline
                                            type="password"
                                            passwordVisibilityToggle="true"
                                            value={password}
                                            onChange={(e) => {
                                                setPassword(e.target.value); // store the password that the user inputs into state
                                                handleUserInput(e);
                                            }}
                                        />
                                    </div>
                                    <div className="field ingest_key">
                                        <div className="title">
                                            <Heading level={3}>Observe Ingest Token:</Heading>
                                            Please provide an Ingest Token for your Observe tenant
                                        </div>
                                        <Text
                                            inline
                                            type="password"
                                            passwordVisibilityToggle="true"
                                            value={ingest_password}
                                            onChange={(e) => {
                                                setIngestPassword(e.target.value); // store the password that the user inputs into state
                                                handleUserInput(e);
                                            }}
                                        />
                                    </div>
                                    <br></br>
                                    <div>
                                        <Button
                                            type="submit"
                                            color='#01A259'
                                            label="Setup Observe"
                                            name="setup_button"
                                            appearance="primary"
                                            onClick={passwordClick} // complete setup by running the password click function
                                        />
                                    </div>
                                    <br />
                                    <div className="error output" />
                                </div>
                            </ColumnLayout.Column>
                        </ColumnLayout.Row>
                    </ColumnLayout>
                </div>
            </div>
        </>
    );
};

export default SetupComponent;
