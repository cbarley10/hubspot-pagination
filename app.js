require("dotenv").config();
const axios = require("axios");
const fs = require("fs");
const hapikey = process.env.API_KEY;
const inquirer = require("./commandline.js");
const arr = [];

const loopThroughObjects = (data, object, property) => {
  if(object === "tickets") {
    data.objects.forEach(item => {
      arr.push(item.properties[property].value);
    });
  } else {
    data[object].forEach(item => {
      if(item.properties && item.properties[property]) {
        arr.push(item.properties[property].value);
      }
    });
  }
}

const appendData = (file, logs, array) => {
  fs.appendFile(file, "\n" + logs + "\n\n" + array, (err) => {
    if(err) {
      console.log("Unable to append to server log");
      console.log("Error:", err);
    }
  });
}

const fetchData = (fullUrl, questionObj) => {
  return axios.get(fullUrl, questionObj)
  .then(response => {
    const data = response.data;
    loopThroughObjects(data, questionObj.object, questionObj.property);
    const offset = questionObj.dataOffset;
    const one = fullUrl.split('&')[0];
    const two = fullUrl.split('&')[1];
    const three = fullUrl.split('&')[2];
    const newUrl = `${one}&${two}&${three}&${questionObj.urlOffset}=${data[offset]}`;
    if (data["has-more"] === true) return fetchData(newUrl, questionObj);
    else return data;
  })
  .catch(error => {
    console.log(error);
  })
};

const main = async (fullUrl, questionObj) => {
  fetchData(fullUrl, questionObj)
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
    console.log("STARTING SERVER");
    console.log("===============");
    console.log(`Getting all ${questionObj.object}`);
    console.log(fullUrl);
    console.log("===============");
  })
  .catch(err => {
    console.log(err);
  });
}).catch(err => {
  console.log(err);
});