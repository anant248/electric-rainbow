## To get this to run on your system

### Step 1.
pull this branch / clone the repository into your system
in terminal cd into the folder where you have this repository

### Step 2.
in terminal run the command: npm install
This will install the required node dependencies from the package-lock.json file

### Step 3.
in terminal run the command: pipenv install msgpack
This installs msgpack in a virtual environment. The existing pipfile (virtualenv) may cause issues so just delete the existing one in your file system
and run the command again

### Step 4.
open two terminals in the same folder location
in one run: npm start
this starts the electron app

in the other run: pipenv run python3 main.py
this runs the python file. Note the python command on your system may be slightly different - ex. pipenv run python main.py
