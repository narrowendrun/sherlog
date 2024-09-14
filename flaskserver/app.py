from flask import Flask, request, jsonify,make_response
from werkzeug.utils import secure_filename
from apirequests import *
from initialize import initialize
import os
import logging
from logging.handlers import RotatingFileHandler

# init app
app = Flask(__name__)


# Configure logging
log_file_path = './logs/app.log'
os.makedirs(os.path.dirname(log_file_path), exist_ok=True)
app.logger.setLevel(logging.INFO)
handler = RotatingFileHandler(log_file_path, maxBytes=5000000, backupCount=10)
handler.setLevel(logging.INFO)
formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
handler.setFormatter(formatter)
app.logger.addHandler(handler)
logging.getLogger('werkzeug').setLevel(logging.WARNING)


# Configure upload folder path
showtech_objects = {}
UPLOAD_FOLDER = './tech-support/upload/'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
# Allowed file extensions
ALLOWED_EXTENSIONS = {'log', 'gz'}
def allowed_file(filename):
    # Split the filename on the last period
    parts = filename.rsplit('.', 1)
    
    # Check if there's no period (file has no extension) or if the extension is allowed
    return len(parts) == 1 or parts[1].lower() in ALLOWED_EXTENSIONS

@app.route('/sherlog/upload', methods=['POST'])
def upload_file():
    # Ensure the upload directory exists
    base_directory = os.path.join("tech-support", "upload")
    os.makedirs(base_directory, exist_ok=True)

    # Check for the 'files' key in the request
    if 'files' not in request.files:
        return make_response("No file part in request", 400)

    # Retrieve the subfolder name from the form data (assuming it's a POST form with key 'subfolder')
    subfolder = request.form.get('subfolder', '')
    if not subfolder:
        return make_response("No subfolder specified", 400)

    # Full path for the subfolder
    directory = os.path.join(base_directory, secure_filename(subfolder))
    os.makedirs(directory, exist_ok=True)

    # Get the list of files
    files = request.files.getlist('files')
    app.logger.info(f"user intends to upload {files} to subfolder {subfolder}")

    # Save each file to the appropriate subfolder
    for file in files:
        if file.filename == '':
            return make_response("No selected file", 400)

        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            file.save(os.path.join(directory, filename))
            app.logger.info(f"saved {file.filename} to {os.path.join(directory, filename)}")

    return make_response("Files uploaded successfully", 200)

@app.route('/sherlog/command',methods=['POST'])
def getCommandOutput():
    required_keys=['filename','command','banner']
    values=[]
    #ensuring all required data is present in the POST request
    for key in required_keys:
        if key in request.json.keys():
            values.append(request.json[key])
        else:
            return jsonify(409,'missing required field(s)')
    filepath=values[0]
    cmd=str(values[1])
    banner=values[2]
    app.logger.info(f"user entered '{banner}' : '{cmd}' for {filepath}")
    if filepath not in showtech_objects:
        showtech_objects[filepath] = initialize(f"./tech-support/{str(filepath)}")
    showtech_objects[filepath].banner = banner
    message = showtech_objects[filepath].command_handler((cmd))
    app.logger.info(f"returned '{cmd}' for {filepath}")
    return {"message" : message}

@app.route('/sherlog/pbdump',methods=['POST'])
def getPbLink():
    required_keys=['filepath','string']
    values=[]
    #ensuring all required data is present in the POST request
    for key in required_keys:
        if key in request.json.keys():
            values.append(request.json[key])
        else:
            return jsonify(409,'missing required field(s)')
    string = values[1]
    filepath = values[0]
    app.logger.info(f"user has dumped outputs to pb for {filepath}")
    message = showtech_objects[filepath].get_pb_link((string)) 
    app.logger.info(f"generated pb link for {filepath}")
    return {"message" : message}
@app.route('/sherlog/resources',methods=['POST'])
def getResources():
    required_keys=['filepath']
    values=[]
    #ensuring all required data is present in the POST request
    for key in required_keys:
        if key in request.json.keys():
            values.append(request.json[key])
        else:
            return jsonify(409,'missing required field(s)')
    filepath=values[0]
    app.logger.info(f"fetching resources for {filepath}") 
    if filepath not in showtech_objects:
        showtech_objects[filepath] = showtech = initialize(f"./tech-support/{str(filepath)}")
    message = {"dictionary":showtech_objects[filepath].cmd_dictionary, "allCommands":showtech_objects[filepath].actualCommands, "glance":showtech_objects[filepath].glance()}
    app.logger.info(f"fetched resources successfully for {filepath}") 
    return json.dumps(message)


@app.route('/sherlog/case', methods=['POST'])
def getCaseFiles():
    required_keys = ['caseNumber']
    values = []
    # Ensure all required data is present in the POST request
    for key in required_keys:
        if key in request.json.keys():
            values.append(request.json[key])
        else:
            return jsonify(409, 'missing required field(s)')
    caseNumber = values[0]
    app.logger.info(f"user looked up SR{caseNumber}") 
    caseID = getCaseID(caseNumber) 
    if(caseID):
        totalFileCount = getTotalFileCount(caseID)
        if(totalFileCount>0):
            app.logger.info(f"fetching fileTree") 
            fileTree = getSNTS(caseID,totalFileCount)
            return fileTree
        else:
            return jsonify({"errors":f"oops! no tech-support files are associated with SR{caseNumber}"})

    else:
        return jsonify({"errors":f"oops! SR{caseNumber} does not exist"})

@app.route('/sherlog/download',methods=['POST'])
def downloadFiles():
    required_keys=['caseNumber','files','sNos','snts']
    values=[]
    #ensuring all required data is present in the POST request
    for key in required_keys:
        if key in request.json.keys():
            values.append(request.json[key])
        else:
            return jsonify(409,'missing required field(s)')
    caseNumber=values[0]
    files=values[1]
    sNos=values[2]
    snts=values[3]
    app.logger.info(f"user intended to download {len(files)} files for {caseNumber}") 
    app.logger.info(f"fetching URLs for {caseNumber}") 
    urls=getShowtechURL(snts)
    downloadStatus=saveFiles(caseNumber,files, sNos,urls)
    if(downloadStatus==200):
        app.logger.info(f"downloaded files successfully") 
        return jsonify({"message":"Downloaded files successfully"})
    else:
        app.logger.error(f"downloaded failed") 
        return jsonify({"message":"Downloaded failed"})
    
@app.route('/sherlog/welcome',methods=['GET'])
def welcome():
   return jsonify("welcome",200)


if __name__ == "__main__":
    app.run()
