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

const fetchData = (fullUrl, object, property, dataOffset, urlOffset) => {
  return axios.get(fullUrl, object, property, dataOffset, urlOffset)
  .then(response => {
    const data = response.data;
    loopThroughObjects(data, object, property);
    const offset = dataOffset;
    const one = fullUrl.split('&')[0];
    const two = fullUrl.split('&')[1];
    const three = fullUrl.split('&')[2];
    const newUrl = `${one}&${two}&${three}&${urlOffset}=${data[offset]}`;
    if (data["has-more"] === true) return fetchData(newUrl, object, property, dataOffset, urlOffset);
    else return data;
  })
  .catch(error => {
    console.log(error);
  })
};

const main = async (fullUrl, object, property, dataOffset, urlOffset) => {
  fetchData(fullUrl, object, property, dataOffset, urlOffset)
  .then(() => {
    console.log(fullUrl);
    let now = new Date().toString();
    let log = `Time Now: ${now}. ${object} with value returned for property "${property}": ${arr.length}`
    console.log(arr);
    console.log(log);
    appendData("server.log", log, arr);
  })
  .catch(error => {
    console.log(error);
  });
}


inquirer.askQuestions.then(answers => {
  const count = answers[2];
  const property = answers[1];
  const url = answers[0][0].uri;
  const object = answers[0][0].name;
  const urlOffset= answers[0][0].urlOffset;
  const dataOffset = answers[0][0].dataOffset;
  const propertySpelling = answers[0][0].propertySpelling;
  const fullUrl = `${url}?hapikey=${hapikey}&count=${count}&${propertySpelling}=${property}`;
  main(fullUrl, object, property, dataOffset, urlOffset)
  .then(() => {
    console.log("STARTING SERVER");
    console.log("===============");
    console.log(`Getting all ${object}`);
    console.log("===============");
  })
  .catch(err => {
    console.log(err);
  });
}).catch(err => {
  console.log(err);
});