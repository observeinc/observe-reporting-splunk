import React, { useState, useEffect } from 'react';
import Button from '@splunk/react-ui/Button';
import Heading from '@splunk/react-ui/Heading';
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

// getter functions


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
        console.log("Status code 409 from passwords endpoint");
        console.log("attempting a pasword update");
        const resp = updatePassword(password);
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



const SetupComponent = () => {
    // create state variables using state hooks

    const [password, setPassword] = useState();
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
                if (response.status >= 200 && response.status <= 299) {
                    // check if password was successfully stored
                    updateAppConf().then((r) => {
                        // update app.conf
                        if (r.status >= 200 && r.status <= 299) {
                            // if app.conf is successfully updated, then reload the page
                            updateObserveConf(tenant_id,observe_site_id).then((r) => {
                                if (r.status >= 200 && r.status <= 299) { 
                                     window.location.href = '/app/observe_reporting/search?q=%7C%20obsv';
                                };
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
                    <Heading level={1}>Welcome to the Observe Reporting App for Splunk</Heading>
                    <ColumnLayout divider="vertical">
                        <ColumnLayout.Row>
                            <ColumnLayout.Column span={6}>
                                <div className="left">
                                    <Heading level={2}>Setup</Heading>
                                    This Splunk app provides a way to query the Observe REST API via a custom search command.
                                    In order to successfully connect Splunk with Observe, please enter your 12 digit Observe tenant ID, 
                                    as well as an API token that has query permissions.
                                    <br></br>
                                    <b>Note: The API Token is different from an Ingest Token!</b>
                                    <div className="field tenant_id">
                                        <div className="title">
                                            <Heading level={3}>Observe Tenant ID:</Heading>
                                            Please specify your Observe Tenant ID:
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
                                            Please specify your Observe site (observeinc.com, observe-eng.com, etc ):
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
                                            Please specify the API token for your Observe tenant:
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
                            <ColumnLayout.Column span={6}>
                                <div className="right">
                                    <img 
                                    src="https://www.observeinc.com/wp-content/uploads/2024/02/O11y-observability-cloud_9f967e.png"
                                    alt="new"
                                    />
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
