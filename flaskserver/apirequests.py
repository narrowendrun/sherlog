import logging
import warnings
from urllib3.exceptions import InsecureRequestWarning

# Suppress only the specific warning
warnings.simplefilter('ignore', InsecureRequestWarning)

import requests
import json
from dotenv import load_dotenv
import os
import re
from collections import defaultdict

#Configure logging
# logging.basicConfig(
#     filename='./logs/app.log',
#     level=logging.INFO,
#     format='%(asctime)s - %(levelname)s - %(message)s - %(name)s'
# )
logger = logging.getLogger('app')

load_dotenv()
bearer_token=os.getenv('BEARER_TOKEN')
base_url = os.getenv('BASE_URL')
headers = {
    'User-Agent': 'narendran',
    'Content-Type': 'application/json',
    'Authorization': f'Bearer {bearer_token}'
}

def makeAPIcall(payload):
    try:
        response = requests.request("POST", base_url, headers=headers, data=payload, verify=False)
        response.raise_for_status()  # Raise an exception for HTTP errors
        data = json.loads(response.text)
        logger.info(f"STA API call successful")
        return data
    except requests.exceptions.RequestException as e:
        logger.error(f"STA API call failed. Error: {e}")
        return {}

#get the ID mapped to the case number from STA
def getCaseID(caseNumber):
    payload = {
        "query": (
            "query ($number: Int!) {"
            "    case(number: $number) {"
            "        id"
            "        number"
            "    }"
            "}"
        ),
        "variables": {
            "number": caseNumber
        }
    }
    payload_json = json.dumps(payload)
    response = makeAPIcall(payload_json)
    
    if not response.get('errors'):
        case_id = response["data"]["case"]["id"]
        logger.info(f"caseID found: {case_id}")
        return case_id
    else:
        logger.warning(f"no caseID found for case number: {caseNumber}")
        return False

#get the serialNumber and fileTimestamps of 'number' number of all files after 'nextCursor' associated with a caseID from STA
def getPaginatedSNTS (caseID, number, nextCursor):
    if(caseID):
        if(nextCursor):
            payload = {
    "query": (
        "query (\n"
        "    $first: Int\n"
        "    $after: String\n"
        "    $last: Int\n"
        "    $before: String\n"
        "    $filterBy: ShowtechFilters\n"
        "    $searchFor: ShowtechSearch\n"
        "    $orderBy: ShowtechOrder\n"
        ") {\n"
        "    showtechs(\n"
        "        first: $first\n"
        "        after: $after\n"
        "        last: $last\n"
        "        before: $before\n"
        "        filterBy: $filterBy\n"
        "        searchFor: $searchFor\n"
        "        orderBy: $orderBy\n"
        "    ) {\n"
        "        totalCount\n"
        "        pageInfo {\n"
        "            startCursor\n"
        "            endCursor\n"
        "            hasNextPage\n"
        "            hasPreviousPage\n"
        "        }\n"
        "        edges {\n"
        "            cursor\n"
        "            node {\n"
        "                id\n"
        "                name\n"
        "                serialNumber\n"
        "                fileTimestamp\n"
        "            }\n"
        "        }\n"
        "    }\n"
        "}"
    ),
    "variables": {
        "first": number,
        "after": nextCursor,
        "filterBy": {
            "caseIds": caseID
        },
        "orderBy": {
            "field": "CREATED_AT",
            "direction": "ASC"
        }
    }
    }
        else:
            payload = {
    "query": (
        "query (\n"
        "    $first: Int\n"
        "    $after: String\n"
        "    $last: Int\n"
        "    $before: String\n"
        "    $filterBy: ShowtechFilters\n"
        "    $searchFor: ShowtechSearch\n"
        "    $orderBy: ShowtechOrder\n"
        ") {\n"
        "    showtechs(\n"
        "        first: $first\n"
        "        after: $after\n"
        "        last: $last\n"
        "        before: $before\n"
        "        filterBy: $filterBy\n"
        "        searchFor: $searchFor\n"
        "        orderBy: $orderBy\n"
        "    ) {\n"
        "        totalCount\n"
        "        pageInfo {\n"
        "            startCursor\n"
        "            endCursor\n"
        "            hasNextPage\n"
        "            hasPreviousPage\n"
        "        }\n"
        "        edges {\n"
        "            cursor\n"
        "            node {\n"
        "                id\n"
        "                name\n"
        "                serialNumber\n"
        "                fileTimestamp\n"
        "            }\n"
        "        }\n"
        "    }\n"
        "}"
    ),
    "variables": {
        "first": number,
        "filterBy": {
            "caseIds": caseID
        },
        "orderBy": {
            "field": "CREATED_AT",
            "direction": "ASC"
        }
    }
    }
        payload_json = json.dumps(payload, indent=4)
        response = makeAPIcall(payload_json)
        return response
    else:
        return False

# format the SNTS result into a sherlog-understandable format
def __formatSNTSResponse(SNTS):
    FileNames = defaultdict(lambda: {
        "isCollapsed": True,
        "isChecked": False,
        "dates": defaultdict(lambda: {
            "isCollapsed": True,
            "isChecked": False,
            "files": defaultdict(dict)
        })
    })

    if not SNTS.get('errors'):
        for edge in SNTS['data']['showtechs']['edges']:
            node = edge['node']

            # Extract the date from the file timestamp
            match = re.match(r"(\d{4}-\d{2}-\d{2})T", node['fileTimestamp'])
            if match:
                fileDate = match.group(1)
                serialNumber = str(node['serialNumber'])

                # Append the file details under the corresponding serial number and date
                FileNames[serialNumber]["dates"][fileDate]['files'][node['name']] = {
                    "serialNumber": serialNumber,
                    "fileTimestamp": node['fileTimestamp'],
                    "name": node['name'],
                    "isChecked": False
                }

        # Convert defaultdict to regular dictionary
        FileNames = {k: dict(v) for k, v in FileNames.items()}
        for serialNumber in FileNames:
            FileNames[serialNumber]["dates"] = {k: dict(v) for k, v in FileNames[serialNumber]["dates"].items()}
        return json.dumps(FileNames, indent=4)
    else:
        return json.dumps(SNTS)

# format SNTS to a format sherlog will understand
# if SNTS is a list (more than 1000 files) then we have to merge the dicts after formatting
# else just format them     
def formatSNTSResponse(SNTS):
    if(isSNTSaList(SNTS)):
        formattedSNTSList=[]
        for item in SNTS:
            formattedSNTSList.append(__formatSNTSResponse(item))
        mergedFormattedSNTS = merge_dicts(formattedSNTSList)
        return mergedFormattedSNTS
    else:
        return __formatSNTSResponse(SNTS)
# if SNTS is a list then it means that more than 1000 files have been requested
def isSNTSaList(SNTS):
    if(type(SNTS)==list):
        return True
    return False
# check if the number of files SNTS is requested for is greater than or less than 1000
# if the number of files is more than 1000 get paginated results as an array with a nextCursor
# else get all the files in one response
def __getSNTS(caseID, number):
    if(number<=1000):
        response = getPaginatedSNTS(caseID,number,None)
        return response
    else:
        logger.info(f"fetching serialNumber and fileTimestamps with nextCursor")
        paginatedArray=paginate(number-1000)
        paginatedResponse=[]
        initResponse = getPaginatedSNTS(caseID,1000,None)
        paginatedResponse.append(initResponse)
        nextCursor=initResponse["data"]["showtechs"]["pageInfo"]["endCursor"]
        for page in paginatedArray:
            response=getPaginatedSNTS(caseID,page,nextCursor)
            paginatedResponse.append(response)
        return (paginatedResponse)
    
#get SNTS for a caseID and the number of files associated with the case
def getSNTS(caseID, number):
    initResponse=__getSNTS(caseID, number)
    formattedResponse = formatSNTSResponse(initResponse)
    logger.info(f"fetched fileTree")
    return formattedResponse    


def getTotalFileCount(caseID):
    if(caseID):
        fileCount=__getSNTS(caseID, 1)
        if(fileCount):
            return fileCount['data']['showtechs']['totalCount']
    else:
        return False

def paginate(fileCount):
    paginatedArray=[]
    while(fileCount>0):
        paginatedArray.append(min(1000,fileCount))
        fileCount-=1000
    logger.info(f"paginated files to {paginatedArray}")
    return paginatedArray

def merge_dicts(dict_list):
    logger.info(f"merging fileTrees")
    merged = {}
    key_count = defaultdict(int)
    
    # Count occurrences of each key
    for d in dict_list:
        for key in json.loads(d).keys():
            key_count[key] += 1
    
    # Separate keys into repeating and non-repeating
    repeating_keys = [key for key, count in key_count.items() if count > 1]
    non_repeating_keys = [key for key, count in key_count.items() if count == 1]
    
    # Merge non-repeating keys
    for d in dict_list:
        jd = json.loads(d)
        for key in non_repeating_keys:
            if key in jd:
                merged[key] = jd[key]
    
    # Initialize merge_repeat with defaultdict
    merge_repeat = defaultdict(lambda: {
        "isCollapsed": True,
        "isChecked": False,
        "dates": defaultdict(dict)
    })
    
    # Merge repeating keys
    for d in dict_list:
        jd = json.loads(d)
        for key in repeating_keys:
            for date, date_data in jd[key]["dates"].items():
                if date not in merge_repeat[key]["dates"]:
                    merge_repeat[key]["dates"][date] = date_data
                else:
                    merge_repeat[key]["dates"][date]["files"].update(date_data["files"])
    
    # Convert defaultdict back to a normal dictionary
    for key in merge_repeat:
        merge_repeat[key]["dates"] = dict(merge_repeat[key]["dates"])
    
    # Add merged repeating keys to merged dictionary
    merged.update(merge_repeat)
    
    return json.dumps(merged)

def calculateNumberOfFiles(files):
    count=0
    files=json.loads(files)
    for device in files:
        for date in files[device]["dates"]:
            count+=len(files[device]["dates"][date]["files"].keys())
    return count

def getShowtechURL(filesList):
    payload = "{\"query\":\"query (\\n    $serialNumberFileTimeStamps: [SerialNumberFileTimeStamp!]!\\n) {\\n    showtechSignedURLs(\\n        serialNumberFileTimeStamps: $serialNumberFileTimeStamps\\n    ) {\\n        urls\\n    }\\n}\\n\",\"variables\":{\"serialNumberFileTimeStamps\":["+filesList+"]}}"
    response = makeAPIcall(payload)
    if not response.get('errors'):
        return response['data']['showtechSignedURLs']['urls']
    else:
        return response

import os
import requests

def saveFiles(caseNumber, filenames, sNos, urls):
    # Create directory for the case number if it doesn't exist
    case_directory = os.path.join("tech-support", str(caseNumber))
    os.makedirs(case_directory, exist_ok=True)
    
    for filename, sNo, url in zip(filenames, sNos, urls):
        # Create a subdirectory for each serial number (sNo)
        sNo_directory = os.path.join(case_directory, sNo)
        os.makedirs(sNo_directory, exist_ok=True)
        
        # Define the full path for the file to be saved
        file_path = os.path.join(sNo_directory, filename)
        
        # Check if the file already exists
        if os.path.exists(file_path):
            print(f"File already present: {file_path}")
            continue  # Skip the download for this file
        
        # Attempt to download the file
        response = requests.get(url)
        if response.status_code == 200:
            # Save the file content to the specified path
            with open(file_path, 'wb') as f:
                f.write(response.content)
            print(f"Downloaded: {filename} to {file_path}")
        else:
            print(f"Failed to download {filename}. Status code: {response.status_code}")
            return 500
    return 200

def getAnalysisJson(caseID):
    payload = f"""{{
    "query": "query (\\n        $first: Int\\n        $after: String\\n        $last: Int\\n        $before: String\\n        $filterBy: ShowtechFilters\\n        $searchFor: ShowtechSearch\\n        $orderBy: ShowtechOrder\\n    ) {{\\n        showtechs(\\n            first: $first\\n            after: $after\\n            last: $last\\n            before: $before\\n            filterBy: $filterBy\\n            searchFor: $searchFor\\n            orderBy: $orderBy\\n        ) {{\\n            edges {{\\n                cursor\\n                node {{\\n                    analysisJson\\n                }}\\n            }}\\n        }}\\n    }}",
    "variables": {{
        "first": 1,
        "filterBy": {{
            "caseIds": "{caseID}"
        }},
        "orderBy": {{
            "field": "CREATED_AT",
            "direction": "ASC"
        }}
    }}
    }}"""
    response=makeAPIcall(payload)
    return response
    return response["data"]["showtechs"]["edges"]["node"]