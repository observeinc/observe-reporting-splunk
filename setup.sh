# setup SPLUNK_HOME environment variable
SPLUNK_HOME="/Users/kchamplin/splunk/splunk"
#APP_HOME=$SPLUNK_HOME/etc/apps/observe_reporting
APP_HOME=/Users/kyle.champlin/programming/SPLUNK_APPS/OBSERVE_REPORTING/observe-reporting-splunk/observe-reporting-splunk/observe_reporting
# setup symbolic links
if [ ! -h $APP_HOME ]; then
   ln -s /Users/kchamplin/splunk/observeinc/observe-reporting-splunk/observe_reporting $SPLUNK_HOME/etc/apps/observe_reporting
   echo "No Symlink Found To Splunk App, Creating It."
else
    echo "Found Symlink To Splunk App at: ${APP_HOME}"
fi

# to build the front end you need to be in
#/Users/kchamplin/splunk/observeinc/observe-reporting-splunk/SUIT/SUIT-setup-page-example
# and then run
# yarn build

# Copy the build artifacts from our Splunk UI project
UI_SOURCE="/Users/kyle.champlin/programming/SPLUNK_APPS/OBSERVE_REPORTING/observe-reporting-splunk/observe-reporting-splunk/SUIT/SUIT-setup-page-example/packages/setup-example-app/stage/appserver/static/pages"
cp $UI_SOURCE/start.js $APP_HOME/appserver/static/pages/settings.js