// require packages
require("dotenv").config();
const axios = require("axios");
const fs = require("fs");
const Bottleneck = require("bottleneck");

// declare other files and variables
const hapikey = process.env.API_KEY;
const inquirer = require("./commandline.js");
// add secondly rate limiting per request
const limiter = new Bottleneck({
  minTime: 100
});

// set empty array
const arr = [];

// loop push all objects to array
// pass in data from the GET, the object you're getting, and the property you're looking for
const pushToArray = (data, object, property) => {
  if(object === "tickets") {
    // const objectMapped = data.objects.map(item => item.properties[property].value);
    // console.log(objectMapped);
    objects.forEach(item => {
      arr.push(item.properties[property].value);
    });
  } else {
    // const objectMapped = data[object].map(item => item.properties[property].value);
    // console.log(objectMapped);
    data[object].forEach(item => {
      if(item.properties && item.properties[property]) {
        arr.push(item.properties[property].value);
      }
    });
  }
}

// declare function that will push data to the array and append it to the server log
const appendData = (file, logs, array) => {
  fs.appendFile(file, "\n" + logs + "\n\n" + array, (err) => {
    if(err) {
      console.log("Unable to append to server log");
      console.log("Error:", err);
    }
  });
}

// make the GET to the URL you choose from the command line interface
// pass through the values from inquirer, and hit the respective endpoint
const fetchData = (fullUrl, { object, property, urlOffset, dataOffset }) => {
  return axios.get(fullUrl)
  .then(({ data }) => {
    pushToArray(data, object, property);
    const newUrl = createNewUrl(fullUrl, urlOffset, data[dataOffset]);
    if (data["has-more"] === true) return fetchData(newUrl, { object, property, urlOffset, dataOffset });
    else return data;
  })
  .catch(error => {
    console.log(error);
  })
};

const createNewUrl = (url, urlOffset, dataOffset) => {
  const newUrl = new URL(url);
  newUrl.searchParams.delete(urlOffset);
  newUrl.searchParams.append(urlOffset, dataOffset);
  return newUrl.toString();
}

// wrap the fetchData call in a main() function to fire all events
const main = async (fullUrl, questionObj) => {
  logStartToConsole(fullUrl, questionObj);
  await limiter.schedule(() => fetchData(fullUrl, questionObj))
  .then(() => {
    let now = new Date().toString();
    let log = `Time Now: ${now}.\n${questionObj.object.toUpperCase()} with value returned for property "${questionObj.property}": ${arr.length}`
    console.log(arr);
    console.log(log);
    appendData("server.log", log, arr);
  })
  .catch(error => {
    console.log(error);
  });
}

const logStartToConsole = (fullUrl, questionObj) => {
  console.log("STARTING SERVER");
  console.log("===============");
  console.log(`Getting all ${questionObj.object}`);
  console.log(fullUrl);
  console.log("===============");
}

const logEndToConsole = () => {
  console.log("===============")
  console.log("DONE")
}

// ask questions in commandline
inquirer.askQuestions.then(answers => {
  const questionObj = {
    count: answers[2],
    property: answers[1],
    url: answers[0][0].uri,
    object: answers[0][0].name,
    urlOffset: answers[0][0].urlOffset,
    dataOffset: answers[0][0].dataOffset,
    propertySpelling: answers[0][0].propertySpelling
  }
  const fullUrl = `${questionObj.url}?hapikey=${hapikey}&count=${questionObj.count}&${questionObj.propertySpelling}=${questionObj.property}`;
  main(fullUrl, questionObj)
  .then(() => {
    logEndToConsole();
  })
  .catch(error => {
    console.log(error);
  });
}).catch(error => {
  console.log(error);
});