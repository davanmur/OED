#!/bin/bash
# 
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#

# Input the pathname for the desired backup directory
# ie PATH="/home/<your_username>/path_to/database_dumps/dump.sql"
# This path MUST exist

# This could probably be programmatically populated. Currently needs to be set manually
db_dump_path="/home/<your_username>/database_dumps" #INPUT REQUIRED

# Generate a timestamp to append to the dump file. This line has errors at the moment.
date=`date +%Y-%m-%d_%H_%M_%S`

# Set the final path for the backup file
final_path="${db_dump_path}/dump_${date}.sql"

# Perform the backup using pg_dump
docker compose exec database pg_dump -U oed > "$final_path"