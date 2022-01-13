const AWS = require("aws-sdk");
const express = require("express");
const serverless = require("serverless-http");
const haversine = require('haversine-distance');

const app = express();

const POST_TABLE = process.env.POST_TABLE;
const JOBSEEKER_TABLE = process.env.JOBSEEKER_TABLE;
const EMPLOYER_TABLE = process.env.EMPLOYER_TABLE;
const dynamoDbClient = new AWS.DynamoDB.DocumentClient();

app.use(express.json());

app.get("/test", async function (req, res) {
  console.log("test success");
  res.json({ test: "Success" });
});

app.post("/addPost", async function (req, res) {
  const {
    postId,
    employerId,
    jobTitle,
    companyName,
    logoUrl,
    industry,
    payRateLow,
    payRateHigh,
    city,
    liked,
    longitude,
    latitude
  } = req.body;
  // data validation
  // if fail, `res.status(400).json({ error: "error message" });`
  const currTime = Date.now();
  const params = {
    TableName: POST_TABLE,
    Item: {
      postId: postId,
      createdAt: currTime,
      modifiedAt: currTime,
      employerId: employerId,
      jobTitle: jobTitle,
      companyName: companyName,
      logo: logo,
      industry: industry,
      payRateLow: payRateLow,
      payRateHigh: payRateHigh,
      city: city,
      liked: liked,
      longitude: longitude,
      latitude: latitude,
      application: null
    }
  };
  try {
    await dynamoDbClient.put(params).promise();
    console.log("data successfully uploaded");
    res.status(200).json({ message: "post successfully created" });
  } catch (error) {
    console.log(error);
    res.status(400).json({ 
        message: "Could not create post",
        error: error
      });
  }
});

app.post("/updateJobPosting", async function (req, res) {
  const {
    postId,
    employer,
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
  const params = {
    TableName: JOBPOSTING_TABLE,
    Key: {
      postId: postId
    },
    Item: {
      postId: postId,
      employer: employer,
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
    console.log("data successfully updated");
    res.status(200).json({ message: "post successfully updated" });
  } catch (error) {
    console.log(error);
    res.status(400).json({ 
        message: "Could not update post",
        error: error
      });
  }
});

app.post("/deleteJobPosting", async function (req, res) {
  const {
    postId
  } = req.body;
  const params = {
    TableName: JOBPOSTING_TABLE,
    Key: {
      postId: postId
    }
  };
  try {
    await dynamoDbClient.delete(params).promise();
    console.log("data successfully deleted");
    res.status(200).json({ message: "post successfully deleted" });
  } catch (error) {
    console.log(error);
    res.status(400).json({ 
        message: "Could not delete post",
        error: error
      });
  }
});

app.get("/getJobPostingByDistance", async function (req, res) {
  const { latitude, longitude, distance } = req.query;
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
      console.log("Could not retreive data");
      res.status(400).json({ message: "Could not retreive data" });
    }
  } catch (error) {
    console.log(error);
    res.status(400).json({ message: "Could not retreive data" });
  }
});

app.get("/getJobSeekerByIndustry", async function (req, res) {
  const { latitude, longitude, distance, industry } = req.query;
  const params = {
    TableName: JOBSEEKER_TABLE
  };
  try {
    const Data = await dynamoDbClient.scan(params).promise();
    if (Data) {
      const Seeker = Data.Items;
      console.log("success");
      res.status(200).json(
          Seeker.filter(function (seeker) {
            var lat = seeker.latitude;
            var lon = seeker.longitude;
            var seekerPos = { lat, lon };
            var storePos = { latitude, longitude };
            return haversine(seekerPos, storePos) <= distance * 1609.34 &&
                   seeker.industry.some((sIndustry) => sIndustry.toLowerCase() === industry.toLowerCase());
          })
        );
    } else {
      console.log("Could not retreive data");
      res.status(400).json({ message: "Could not retreive data" });
    }
  } catch (error) {
    console.log(error);
    res.status(400).json({ message: "Could not retreive data" });
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
    latitude,
    longitude,
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
      industry: industry,
      badge: badge,
      photoUrl: photoUrl,
      buupCount: buupCount,
      skills: skills,
      socialMedia: socialMedia,
      timestamp: timestamp,
      wageMin: wageMin,
      wageMax: wageMax,
      zipCode: zipCode,
      latitude: latitude,
      longitude: longitude,
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
    companyInfo
  } = req.body;
  const checkParams = {
    TableName: EMPLOYER_TABLE,
    KeyConditionExpression: 'userId = :userId',
    ExpressionAttributeValues: {
      ':userId': userId
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
      message: "Could not create employer account",
      error: error
    });
  }
  let currTime = new Date();
  const params = {
    TableName: EMPLOYER_TABLE,
    Item: {
      userId: userId,
      createdAt: currTime,
      modifiedAt: currTime,
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

app.post("/getCurrentJobPosting", async function (req, res) {
  const { loginId } = req.body;
  const params = {
    TableName: JOBPOSTING_TABLE
  };
  try {
    const Data = await dynamoDbClient.scan(params).promise();
    if (Data && Data.Items.length > 0) {
      res.status(200).json(
        {
          message: "success",
          jobPosting: Data.Items.filter((item) => { return item.employer === loginId })
        }
      )
    } else {
      console.log("No job postings");
      res.status(200).json({ message: "No job postings" });
    }
  } catch (error) {
    console.log(error);
    res.status(400).json({
      message: "Could not find job postings",
      error: error
    });
  }
});

app.use((req, res, next) => {
  return res.status(404).json({
    message: "Not Found",
  });
});

module.exports.handler = serverless(app);
