location='/opt/splunk/share/splunk/app_packages/observe_reporting.spl'

#ssh -i "kyle.champlin.pem" ec2-user@34.220.187.32

scp -i "kyle.champlin.pem" ec2-user@34.220.187.32:$location ./observe_reporting.tar.gz