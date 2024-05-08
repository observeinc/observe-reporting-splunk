# observe-reporting-splunk

This repo contains two subdirectories:

## observe_reporting
This is the Splunk app proper, it contains custom search commands, and a setup UI. Most of this is just configuration code and python. The front end is built via the source code in the `SUIT` directory.
The custom search command reference is quite nice here:
https://github.com/splunk/splunk-app-examples/tree/master/custom_search_commands

## SUIT
The Splunk UI team has provided example of how to integrate their React libraries, this is the configuration example available here: 

https://github.com/splunk/SUIT-setup-page-example

Because UI toolchain are an area unto themselves, we're merely doing the UI edits in this subdirectory, and then doing a `yarn build` and then copying the resulting page into the Splunk app proper.

