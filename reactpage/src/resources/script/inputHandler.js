const hiddenKeys = {
  "*<et-interface>": {
    regex: "^(?:ethernet|etherne|ethern|ether|ethe|eth|et)",
    string: "ethernet",
  },
  "*<po-interface>": {
    regex:
      "^(?:port-channel|port-channe|port-chann|port-chan|port-cha|port-ch|port-c|port|por|po)",
    string: "port-channel",
  },
  "*<ma-interface>": {
    regex:
      "^(?:management|managemen|manageme|managem|manage|manag|mana|man|ma)",
    string: "management",
  },
  "*<lo-interface>": {
    regex: "^(?:loopback|loopbac|loopba|loopb|loop|loo|lo)",
    string: "loopback",
  },
};
function formatParser(command) {
  let pipeIndex = command.indexOf("|");
  let prePipe = "";
  let postPipe = "";
  if (pipeIndex >= 0) {
    prePipe = command.slice(0, pipeIndex - 1);
    postPipe = command.slice(pipeIndex);
  } else {
    prePipe = command;
  }
  let output = prePipe
    .toString()
    .trimStart()
    .replace(/[^\w\s\/\-&()|:<>.,]/g, "")
    // Remove all non-alphanumeric and non-whitespace characters except for '?'
    .replace(/\?/g, "") // Replace all '?' characters with an empty string
    .split(" ")
    .filter((char) => char !== "");

  let result = {
    command: output,
    piper: postPipe,
  };
  return result;
}
export function searchStrings(allCommands, input) {
  if (input.trim() === "") {
    return allCommands.sort();
  } else {
    const escapedInput = input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regexPattern = escapedInput
      .split(" ")
      .map((word) => `\\b${word}`)
      .join(".*");
    const regex = new RegExp(regexPattern, "i");
    let output = [];

    for (let i = 0; i < allCommands.length; i++) {
      if (regex.test(allCommands[i])) {
        output.push(allCommands[i]);
      }
    }

    return output.sort();
  }
}
export function bestMatch(command, commandArray, daisychain) {
  let parsedCommand = formatParser(command);
  let inputArray = parsedCommand.command;
  let pipeArray = parsedCommand.piper;
  if (inputArray.length == 0) {
    return false;
  }
  const completed = [];
  const completedInternal = [];
  let matches = [];
  const replacements = {};
  let regexMatches = { true: [], any: [] };
  for (let i = 0; i < inputArray.length; i++) {
    let currentKeys = Object.keys(commandArray);
    for (let j = 0; j < currentKeys.length; j++) {
      let regex = new RegExp(`^${inputArray[i]}`, "i");
      let isAny = currentKeys[j].includes("*");
      if (isAny) {
        // console.log(currentKeys[j]);
        let regexKey = Object.keys(commandArray[currentKeys[j]].regex)[0];
        let regexForAny = new RegExp(`${regexKey}`, "i");
        // console.log(inputArray[i], currentKeys[j], regexForAny);
        if (regexForAny.test(inputArray[i])) {
          regexMatches.any.push(currentKeys[j]);
        }
      } else {
        let matchResult = regex.test(currentKeys[j]);
        if (matchResult) {
          regexMatches[matchResult].push(currentKeys[j]);
        }
      }
    }
    // console.log(inputArray[i], regexMatches);
    if (regexMatches.true.length == 0 && regexMatches.any.length == 0)
      return false;
    if (regexMatches.true.length) {
      matches = regexMatches.true;
      if (matches.length > 1) {
        if (matches.includes(inputArray[i])) {
          matches = [];
          matches.push(inputArray[i]);
        } else return false;
      }
      if (matches.length == 1) {
        commandArray = commandArray[matches[0]];
        completed.push(matches[0]);
        completedInternal.push(matches[0]);
      }
      matches = [];
      regexMatches = { true: [], any: [] };
    }
    if (regexMatches.any.length) {
      commandArray = commandArray[regexMatches.any[0]].branches;
      if (Object.keys(hiddenKeys).includes(regexMatches.any[0])) {
        const intRegex = new RegExp(
          `${hiddenKeys[regexMatches.any[0]].regex}`,
          "i"
        );
        const modified = `${
          hiddenKeys[regexMatches.any[0]].string
        } ${inputArray[i].replace(intRegex, "")}`;
        completed.push(modified);
      } else {
        completed.push(inputArray[i]);
      }
      completedInternal.push(regexMatches.any[0]);
      regexMatches.any = [];
    }
  }
  // console.log("completedInternal", completedInternal);
  if (daisychain) {
    if (pipeArray !== "") {
      return false;
    } else {
      return completedInternal;
    }
  }
  if (pipeArray !== "") {
    return `${completed.join(" ")} ${pipeArray}`;
  } else {
    return completed.join(" ");
  }
}

export function autoComplete(command, commandArray) {
  if (command.endsWith(" ")) return false;
  let bm = bestMatch(command, commandArray, true);
  // console.log(bm);
  let parsedCommand = formatParser(command);
  if (bm) {
    if (bm[bm.length - 1] && bm[bm.length - 1].includes("*")) return false;
    let inputArray = parsedCommand.command;
    inputArray.pop();
    let completdOutput = `${inputArray.join(" ")} ${bm[bm.length - 1]}`;
    return completdOutput.trimStart();
  }
  return false;
}

export function getPossibleCommands(command, commandArray) {
  let bm = bestMatch(command, commandArray, true);
  let parsedCommand = formatParser(command);
  if (parsedCommand.piper !== "") return false;
  if (command.trim() === "") {
    return Object.keys(commandArray);
  } else if (command.endsWith(" ")) {
    if (!bm) return false;
    for (let i = 0; i < bm.length; i++) {
      if (bm[i].includes("*")) {
        commandArray = commandArray[bm[i]].branches;
      } else {
        commandArray = commandArray[bm[i]];
      }
    }
    if (commandArray) {
      return Object.keys(commandArray)
        .map((key) => key.replace("*", ""))
        .sort();
    } else return false;
  } else if (command.endsWith("")) {
    let regex = new RegExp(`^${parsedCommand.command.pop()}`, "i");
    let prevBm = bestMatch(parsedCommand.command.join(" "), commandArray, true);
    // console.log(prevBm, regex);
    for (let i = 0; i < prevBm.length; i++) {
      if (prevBm[i].includes("*")) {
        commandArray = commandArray[prevBm[i]].branches;
      } else {
        commandArray = commandArray[prevBm[i]];
      }
    }
    let matchingKeys = [];
    // console.log(commandArray);
    Object.keys(commandArray).forEach((key) => {
      // console.log(key, regex, regex.test(key));
      if (regex.test(key)) {
        matchingKeys.push(key);
      }
    });
    if (matchingKeys.length) {
      return matchingKeys.map((key) => key.replace("*", ""));
    }
    return false;
  }
}
