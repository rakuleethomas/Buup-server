const AWS = require("aws-sdk");
const express = require("express");
const serverless = require("serverless-http");
const haversine = require('haversine-distance');

const app = express();

const USERS_TABLE = process.env.USERS_TABLE;
const JOBPOSTING_TABLE = process.env.JOBPOSTING_TABLE;
const dynamoDbClient = new AWS.DynamoDB.DocumentClient();

app.use(express.json());

app.get("/test", async function (req, res) {
  res.json(
  {
    test: "Success"
  });
});

app.post("/addJobPosting", async function (req, res) {
  const {
    postId,
    jobTitle,
    companyName,
    logo,
    payRateLow,
    payRateHigh,
    city,
    liked,
    longitude,
    latitude
  } = req.body;
  // data validation
  // if fail, `res.status(400).json({ error: "error message" });`
  const params = {
    TableName: JOBPOSTING_TABLE,
    Item: {
      postId: postId,
      jobTitle: jobTitle,
      companyName: companyName,
      logo: logo,
      payRateLow: payRateLow,
      payRateHigh: payRateHigh,
      city: city,
      liked: liked,
      longitude: longitude,
      latitude: latitude
    }
  };
  try {
    await dynamoDbClient.put(params).promise();
    res.status(200).json({ message: "data successfully uploaded" });
  } catch (error) {
    console.log(error);
    res.status(400).json({ 
        error: "Could not create post",
        message: error
      });
  }
});

app.get("/getJobPostingByDistance", async function (req, res) {
  const { latitude, longitude, distance } = req.query;
  // calculate the dist
  // return if it's within the dist
  const params = {
    TableName: JOBPOSTING_TABLE
  };
  try {
    const Data = await dynamoDbClient.scan(params).promise();
    if (Data) {
      const Posting = Data.Items;
      res.status(200).json(
          Posting.filter(function (post) {
            var lat = post.latitude;
            var lon = post.longitude;
            var userPos = { latitude, longitude };
            var storePos = { lat, lon };
            return haversine(userPos, storePos) <= distance * 1609.34;
          })
        );
    } else {
      res.status(404).json({ error: "Could not retreive data" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Could not retreive data" });
  }
});

app.use((req, res, next) => {
  return res.status(404).json({
    error: "Not Found",
  });
});


module.exports.handler = serverless(app);
