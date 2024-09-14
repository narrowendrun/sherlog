from apirequests import *
import time
caseNumber = input("enter case number : ")
start_time = time.time()
print("getting caseID...")
caseID = getCaseID(caseNumber)  
if(caseID):
    print("getting totalFileCount...")
    totalFileCount = getTotalFileCount(caseID)
    if(totalFileCount>0):
        print("getting allSNTS...")
        SNTS=getSNTS(caseID,totalFileCount)
    
        end_time = time.time()

        print("............................................")
        print("case ID :",caseID)
        print("total associated files :",totalFileCount)
        print(json.loads(SNTS).keys())
        print("............................................")

        print()
        duration = end_time - start_time
        print("fetched SNTS for", calculateNumberOfFiles(SNTS),"files in:", duration, "seconds for SR",caseNumber)
        print()
        print("getting analysisJson...")
        analysis=getAnalysisJson(caseID)
        print(json.dumps(analysis, indent=4))
    else:
        print("oops! no tech-support files are associated with SR",caseNumber)
else:
    print("oops! SR",caseNumber,"does not exist")