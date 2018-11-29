require("dotenv").config();
const axios = require("axios");
const fs = require("fs");
const hapikey = process.env.API_KEY;

const property = "email";
const object = "contacts";
const mainUrl = `https://api.hubapi.com/contacts/v1/lists/all/contacts/all?hapikey=${hapikey}&count=100&property=${property}`;
const arr = [];

const loopThroughObjects = (data) => {
  data[object].forEach((item) => {
    if(item.properties[property] && item.properties[property].value){
      arr.push(item.properties[property].value)
    }
  });
}

const appendData = (file, logs, array) => {
  fs.appendFile(file, "\n" + logs + "\n\n" + array, (err) => {
    if(err) {
      console.log("Unable to append to server log");
    }
  });
}

const fetchData = (url) => {
  return axios.get(url)
  .then(response => {
    const data = response.data;
    loopThroughObjects(data);
    const newUrl = `${mainUrl}&vidOffset=${data["vid-offset"]}`;
    if (data["has-more"] === true) return fetchData(newUrl);
    else return data;
  })
  .catch((err) => {
    console.log(error);
  })
};

const main = async () => {
  fetchData(mainUrl)
  .then(() => {
    let now = new Date().toString();
    let log = `Time Now: ${now}. ${object.charAt(0).toUpperCase() + object.slice(1)} with value returned: ${arr.length}`
    console.log(log);
    console.log(arr);
    appendData("server.log", log, arr);
  })
  .catch((error) => {
    console.log(error);
  });
}

main()
  .then((response) => {
    console.log("STARTING SERVER");
    console.log("===============");
  });