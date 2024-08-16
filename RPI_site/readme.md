# Work Log (RCOS)
As Professor Turner is aware, I spent much of this semester working to upload a version of OED to RPI's server for use by the school. As this does not have proof in commits, this is a list of everything I contributed towards this.

* Worked with Steve to install OED on the virtual machine - (2 - 3 weeks)
    * Downloaded OED
    * Worked to get it to run continously on server
    * Worked to make in run securely (in progress)

* Uploaded RPI data to RPI OED - (3 - 4 weeks)
    * reviewed the RPI data, searched for start dates
    * began uploading historical data for current 5 meters
    * came across many issues: negative readings, 1 second apart data points, etc.
    * after carefully reviewing with Steve, came up with solution to remedy this issue
    * wrote and tested script to delete most bad points (```clean_one_second_pairs.py```)
        * also wrote scripts: ```second_difference.py``` and ```value_difference.py``` to help better check / visual data points
    * ran scripts on 5 data files
    * cleaned up remaining issues in data (and wrote down all changes made in log)
    * uploaded historical data of the 5 meters
