const inquirer = require("inquirer");

const endpoints = [
  {
    name: "contacts",
    uri: "https://api.hubapi.com/contacts/v1/lists/all/contacts/all",
    urlOffset: "vidOffset",
    dataOffset: "vid-offset",
    propertySpelling: "property"
  },
  {
    name: "deals",
    uri: "https://api.hubapi.com/deals/v1/deal/paged",
    urlOffset: "offset",
    dataOffset: "offset",
    propertySpelling: "properties"
  },
  {
    name: "companies",
    uri: "https://api.hubapi.com/companies/v2/companies/paged",
    urlOffset: "offset",
    dataOffset: "offset",
    propertySpelling: "properties"
  },
  {
    name: "tickets",
    uri: "https://api.hubapi.com/crm-objects/v1/objects/tickets/paged",
    urlOffset: "offset",
    dataOffset: "offset",
    propertySpelling: "properties"
  }
];

const askQuestions = inquirer.prompt([
  {
    message: "Which object would you like to loop through?",
    type: "rawlist",
    name: "endpoint",
    choices: ["contacts", "tickets", "companies", "deals"]
  },
  {
    message: "Which property are you looking for?",
    type: "input",
    name: "props"
  },
  {
    message: "How many objects would you like to retrieve per call (up to 100)?",
    type: "input",
    name: "number",
  }
])
.then(answers => {
  const data = endpoints.filter(endpoint => endpoint.name === answers.endpoint);
  return [data, answers.props, answers.number];
}).catch((err) => {
  console.log(err);
});



module.exports = {
  askQuestions
};