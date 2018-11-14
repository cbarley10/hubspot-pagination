require("dotenv").config();
const axios = require("axios");
const fs = require("fs");
const hapikey = process.env.API_KEY;

const contactsUrl = `https://api.hubapi.com/contacts/v1/lists/all/contacts/all?hapikey=${hapikey}&count=1000&property=cake_preference`
const arr = [];

const fetchData = (url) => {
  return axios.get(url).then(response => {
    const data = response.data;
    data.contacts.forEach((item)=>{
      if(item.properties.cake_preference){
        if(item.properties.cake_preference.value === "Chocolate"){
          arr.push(item.properties.cake_preference.value);
        }
      }
    });
    const newUrl = `${contactsUrl}&vidOffset=${data["vid-offset"]}`;
    if (data["has-more"] === true) return fetchData(newUrl);
    else return data;
  })
};

const main = async () => {
  fetchData(contactsUrl).then((result) => {
    let now = new Date().toString();
    let log = `Time Now: ${now}. Contacts with value returned: ${arr.length}`
    console.log(log);
    console.log(arr);
    fs.appendFile("server.log", log + "\n\n" + arr, (err) => {
      if(err) {
        console.log("Unable to append to server log");
      }
    });
  }).catch((error) => {
    console.log(error);
  });
}

main()
  .then((response) => {
    console.log("STARTING SERVER");
    console.log("===============");
  });