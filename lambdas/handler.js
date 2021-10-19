const AWS = require("aws-sdk");
const express = require("express");
const serverless = require("serverless-http");
const haversine = require('haversine-distance');

const app = express();

const USERS_TABLE = process.env.USERS_TABLE;
const JOBPOSTING_TABLE = process.env.JOBPOSTING_TABLE;
const JOBSEEKER_TABLE = process.env.JOBSEEKER_TABLE;
const EMPLOYER_TABLE = process.env.EMPLOYER_TABLE;
const INDUSTRY_TABLE = process.env.INDUSTRY_TABLE;
const dynamoDbClient = new AWS.DynamoDB.DocumentClient();

app.use(express.json());

app.get("/test", async function (req, res) {
  console.log("test success");
  res.json({ test: "Success" });
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
    console.log("data successfully uploaded");
    res.status(200).json({ message: "data successfully uploaded" });
  } catch (error) {
    console.log(error);
    res.status(400).json({ 
        message: "Could not create post",
        error: error
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
      console.log("success");
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
      console.log("Could not retrieve data");
      res.status(400).json({ message: "Could not retrieve data" });
    }
  } catch (error) {
    console.log(error);
    res.status(400).json({ message: "Could not retrieve data" });
  }
});

app.post("/jobSeekerSignUp", async function (req, res) {
  const {
    userId,
    firstName,
    lastName,
    email,
    loginId,
    password,
    verified,
    industry,
    badge,
    photoUrl,
    buupCount,
    skills,
    socialMedia,
    timestamp,
    wageMin,
    wageMax,
    zipCode,
    availability
  } = req.body;
  const checkParams = {
    TableName: JOBSEEKER_TABLE,
    KeyConditionExpression: 'loginId = :loginId',
    ExpressionAttributeValues: {
      ':loginId': loginId
    }
  };
  try {
    const Data = await dynamoDbClient.query(checkParams).promise();
    if (Data.Items.length > 0) {
      res.status(400).json({ message: "Your account already exists" });
      return;
    }
  } catch (error) {
    console.log(error);
    res.status(400).json({
      message: "Could not sign up",
      error: error
    });
    return;
  }
  const params = {
    TableName: JOBSEEKER_TABLE,
    Item: {
      userId: userId,
      firstName: firstName,
      lastName: lastName,
      email: email,
      loginId: loginId,
      password: password,
      verified: verified,
      insdustry: industry,
      badge: badge,
      photoUrl: photoUrl,
      buupCount: buupCount,
      skills: skills,
      socialMedia: socialMedia,
      timestamp: timestamp,
      wageMin: wageMin,
      wageMax: wageMax,
      zipCode: zipCode,
      availability: availability
    }
  };
  try {
    await dynamoDbClient.put(params).promise();
    console.log("account successfully created");
    res.status(200).json({ 
      message: "account successfully created",
      data: params
    });
  } catch (error) {
    console.log(error);
    res.status(400).json({ 
        message: "Could not create job seeker",
        error: error
      });
  }
});

app.post("/jobSeekerSignIn", async function (req, res) {
  const { loginId, password } = req.body;
  const params = {
    TableName: JOBSEEKER_TABLE,
    KeyConditionExpression: 'loginId = :loginId',
    ExpressionAttributeValues: {
      ':loginId': loginId
    }
  };
  try {
    const Data = await dynamoDbClient.query(params).promise();
    if (Data && Data.Items[0].password === password) {
      var userInfo = Data.Items[0];
      userInfo.password = "";
      res.status(200).json({ message: userInfo });
    } else {
      console.log("The info does not match our database");
      res.status(400).json({ message: "The info does not match our database" });
    }
  } catch (error) {
    console.log(error);
    res.status(400).json({
      message: "Could not sign in",
      error: error
    });
  }
});

app.post("/employerSignUp", async function (req, res) {
  const {
    userId,
    firstName,
    lastName,
    email,
    loginId,
    password,
    verified,
    industry,
    photoUrl,
    socialMedia,
    timestamp,
    companyInfo
  } = req.body;
  const checkParams = {
    TableName: EMPLOYER_TABLE,
    KeyConditionExpression: 'loginId = :loginId',
    ExpressionAttributeValues: {
      ':loginId': loginId
    }
  };
  try {
    const Data = await dynamoDbClient.query(checkParams).promise();
    if (Data.Items.length > 0) {
      console.log("Your account already exists");
      res.status(400).json({ message: "Your account already exists" });
      return;
    }
  } catch (error) {
    console.log(error);
    res.status(400).json({
      message: "Could not create employer",
      error: error
    });
  }
  const params = {
    TableName: EMPLOYER_TABLE,
    Item: {
      userId: userId,
      firstName: firstName,
      lastName: lastName,
      email: email,
      loginId: loginId,
      password: password,
      verified: verified,
      industry: industry,
      photoUrl: photoUrl,
      socialMedia: socialMedia,
      timestamp: timestamp,
      companyInfo: companyInfo
    }
  };
  try {
    await dynamoDbClient.put(params).promise();
    console.log("account successfully created");
    res.status(200).json({ 
      message: "account successfully created",
      data: params
    });
  } catch (error) {
    console.log(error);
    res.status(400).json({ 
        message: "Could not create job seeker",
        error: error
      });
  }
});

app.post("/employerSignIn", async function (req, res) {
  const { loginId, password } = req.body;
  const params = {
    TableName: EMPLOYER_TABLE,
    KeyConditionExpression: 'loginId = :loginId',
    ExpressionAttributeValues: {
      ':loginId': loginId
    }
  };
  try {
    const Data = await dynamoDbClient.query(params).promise();
    if (Data && Data.Items[0].password === password) {
      var userInfo = Data.Items[0];
      userInfo.password = "";
      res.status(200).json({ message: userInfo });
    } else {
      console.log("The info does not match our database");
      res.status(400).json({ message: "The info does not match our database" });
    }
  } catch (error) {
    console.log(error);
    res.status(400).json({
      message: "Could not sign in",
      error: error
    });
  }
});

app.post("/addIndustry", async function (req, res) {
  const {
    industryCode,
    industryName
  } = req.body;
  const params = {
    TableName: INDUSTRY_TABLE,
    Item: {
      industryCode: industryCode,
      industryName: industryName
    },
    KeyConditionExpression: 'industryCode = :industryCode',
    ExpressionAttributeValues: {
      ':industryCode': industryCode
    }
  };
  try {
    const Data = await dynamoDbClient.query(params).promise();
    if (Data.Items.length > 1) {
      console.log("Industry already exists");
      res.status(400).json({ message: "Industry already exists" });
      return;
    }
    console.log("Industry successfully added");
    res.status(200).json({ message: "Industry successfully added" });
  } catch (error) {
    console.log(error);
    res.status(400).json({
      message: "Could not create industry",
      error: error
    });
  }
});

app.get("/getIndustry", async function (req, res) {
  const params = {
    TableName: INDUSTRY_TABLE,
  };
  try {
    const Data = await dynamoDbClient.scan(params).promise();
    if (Data) {
      const Posting = Data.Items;
      console.log("success");
      res.status(200).json({
        data: Data.Items.sort( function( a, b ) {
          return a.industryName < b.industryName ? -1 : a.industryName > b.industryName ? 1 : 0;
        })
      });
    } else {
      console.log("Could not retreive industry");
      res.status(400).json({ message: "Could not retreive industry" });
    }

  } catch (error) {
    console.log(error);
    res.status(400).json({ message: "Could not retrieve industry" });
  }
});

app.use((req, res, next) => {
  return res.status(404).json({
    message: "Not Found",
  });
});


module.exports.handler = serverless(app);
