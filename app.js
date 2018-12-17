// require packages
require("dotenv").config();
const axios = require("axios");
const fs = require("fs");
const hapikey = process.env.API_KEY;
const inquirer = require("./commandline.js");
// set empty array
const arr = [];

// loop through all objects
// pass in data from the GET, the object you're getting, and the property you're looking for
const loopThroughObjects = (data, object, property) => {
  if(object === "tickets") {
    data.objects.forEach(item => {
      // push to the empty array
      arr.push(item.properties[property].value);
    });
  } else {
    data[object].forEach(item => {
      if(item.properties && item.properties[property]) {
        // push to the empty array if there's a value
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
const fetchData = (fullUrl, questionObj) => {
  return axios.get(fullUrl, questionObj)
  .then(response => {
    const data = response.data;
    // loop through the objects passing in the data from the GET, the obejct, and the property
    loopThroughObjects(data, questionObj.object, questionObj.property);
    // declare variables to construct newUrl in order to avoid concatenation of offset value instead of replacement
    const offset = questionObj.dataOffset;
    const one = fullUrl.split('&')[0];
    const two = fullUrl.split('&')[1];
    const three = fullUrl.split('&')[2];
    const newUrl = `${one}&${two}&${three}&${questionObj.urlOffset}=${data[offset]}`;
    // if there are more objects to be returned, make another GET with the returned offset value
    if (data["has-more"] === true) return fetchData(newUrl, questionObj);
    // make requests until has-more is false
    else return data;
  })
  .catch(error => {
    console.log(error);
  })
};

// wrap the fetchData call in a main() function to fire all events
const main = async (fullUrl, questionObj) => {
  start(fullUrl, questionObj);
  await fetchData(fullUrl, questionObj)
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

const start = (fullUrl, questionObj) => {
  console.log("STARTING SERVER");
  console.log("===============");
  console.log(`Getting all ${questionObj.object}`);
  console.log(fullUrl);
  console.log("===============");
}

// ask questions in commandline
inquirer.askQuestions.then(answers => {
  // set object to be used in most later functions
  const questionObj = {
    count: answers[2],
    property: answers[1],
    url: answers[0][0].uri,
    object: answers[0][0].name,
    urlOffset: answers[0][0].urlOffset,
    dataOffset: answers[0][0].dataOffset,
    propertySpelling: answers[0][0].propertySpelling
  }
  // build the URL we'll use to make GET requests
  const fullUrl = `${questionObj.url}?hapikey=${hapikey}&count=${questionObj.count}&${questionObj.propertySpelling}=${questionObj.property}`;
  // start the program by running the main() function
  main(fullUrl, questionObj)
  .then(() => {
    console.log("===========")
    console.log("DONE")
  })
  .catch(error => {
    console.log(error);
  });
}).catch(error => {
  console.log(error);
});