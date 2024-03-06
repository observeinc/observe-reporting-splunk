# password 
# bBtnHY6gzYEag9Spb3!
FART=`curl -u "kchamplin:bBtnHY6gzYEag9Spb3!" --url "https://api.splunk.com/2.0/rest/login/splunk"`
TOK=`echo $FART | jq -r .data.token`
echo $TOK
PACK_LOC="observe_reporting.zip"

curl -X 'POST' \
  'https://appinspect.splunk.com/v1/app/validate' \
  -H 'accept: application/json' \
  -H "Authorization: Bearer $TOK" \
  -H "Cache-Control: no-cache" \
  -F "app_package=@observe_reporting.zip" \
  -F "included_tags=cloud" 

# https://dev.splunk.com/enterprise/docs/releaseapps/packageapps/#Third-party-utilities-and-CLI-commands
# COPYFILE_DISABLE=1 tar --format ustar -cvzf observe_reporting.tar.gz observe_reporting