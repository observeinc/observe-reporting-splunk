# setup SPLUNK_HOME environment variable
SPLUNK_HOME="/Users/kchamplin/splunk/splunk"
APP_HOME=$SPLUNK_HOME/etc/apps/observe_reporting
# setup symbolic links
if [ ! -h $APP_HOME ]; then
   ln -s /Users/kchamplin/splunk/observeinc/observe-reporting-splunk/observe_reporting $SPLUNK_HOME/etc/apps/observe_reporting
   echo "No Symlink Found To Splunk App, Creating It."
else
    echo "Found Symlink To Splunk App at: ${APP_HOME}"
fi
