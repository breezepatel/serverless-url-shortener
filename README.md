````markdown
# 🚀 Build a Serverless URL Shortener with AWS

Have you ever used services like Bit.ly or TinyURL to shorten long links? These tools transform lengthy URLs into short, easy-to-share links while tracking clicks and user engagement.

Did you know you can build your own URL shortener using AWS without managing any servers?

🔗 [Live Demo](http://urlshortnerbreezepatel.s3-website.ca-central-1.amazonaws.com/)

---

## Why Build a Serverless URL Shortener?

URL shorteners are essential tools for making long, cumbersome URLs more manageable. With AWS, we can build a fully serverless URL shortener using services such as:

- ✅ Amazon DynamoDB (for storing URL mappings)  
- ✅ Amazon API Gateway (for handling API requests)  
- ✅ Amazon S3 (for hosting the frontend website)  

This approach creates a scalable, cost-effective, and highly available service without managing infrastructure.

---

## Architecture Overview

The URL shortener architecture consists of:

- **Client (Web App):** Hosted on S3, providing the user interface.  
- **API Gateway:** Entry point for API requests.  
- **DynamoDB Table:** Stores mappings of short URLs to long URLs.  
- **AWS Lambda (Optional):** For extra business logic, though API Gateway can interact directly with DynamoDB.  

---

## Example URLs

- **Long URL:**  
  `https://remarkable-cicada-dc1.notion.site/Docker-DevOps-Project-Create-a-Game-using-Docker-and-Deploy-to-AWS-Cloud-d7d287056241428d8cf011e51bb35970`  

- **Short URL:**  
  `https://k63dfg8pb6.execute-api.ca-central-1.amazonaws.com/dev/direct-ddb/vkjBrS`  

---

## AWS Services Used

### 1. Amazon S3

- Object storage service for hosting static files (HTML, JS, CSS).  
- Used here to host the front-end website.  

### 2. Amazon API Gateway

- Processes HTTP requests from clients.  
- Interacts with DynamoDB for data storage and retrieval.  

### 3. Amazon DynamoDB

- NoSQL database storing URL mappings.  
- Serverless, scalable, and low-latency.  

### 4. AWS Lambda (Optional)

- Executes code without managing servers.  
- Used optionally for additional business logic.  
- Not required since API Gateway can directly call DynamoDB.  

---

## Hands-on Guide

### Step 1: Set Up DynamoDB Table

1. Open AWS Console → DynamoDB → Create Table.  
2. Table Name: `URL-Shortener`  
3. Partition Key: `shortId` (String)  
4. Add a Global Secondary Index with `owner` as partition key.  
5. Create the table and wait for provisioning.  

---

### Step 2: Configure API Gateway

We will create two endpoints:

- `POST /direct-ddb` — Store short URLs.  
- `GET /direct-ddb/{shortId}` — Retrieve long URLs and redirect.  

#### 2.1 Create POST /direct-ddb API

- Create REST API in API Gateway.  
- Add resource `/direct-ddb` and method `POST`.  
- Integration type: AWS Service → DynamoDB → Action: `UpdateItem`.  
- Create IAM Role with permissions: `dynamodb:PutItem`, `dynamodb:UpdateItem`.  
- Attach role to API Gateway.  
- Use this **Request Mapping Template**:

```json
{
  "TableName": "URL-Shortener",
  "ConditionExpression": "attribute_not_exists(id)",
  "Key": {
    "shortId": {
      "S": "$input.json('$.shortURL')"
    }
  },
  "ExpressionAttributeNames": {
    "#u": "longURL",
    "#o": "owner"
  },
  "ExpressionAttributeValues": {
    ":u": {
      "S": "$input.json('$.longURL')"
    },
    ":o": {
      "S": "$input.json('$.owner')"
    }
  },
  "UpdateExpression": "SET #u = :u, #o = :o",
  "ReturnValues": "ALL_NEW"
}
````

* Use this **Integration Response Mapping Template**:

```json
#set($DDBResponse = $input.path('$'))
{
  "shortURL": "$DDBResponse.Attributes.shortId.S",
  "longURL": "$DDBResponse.Attributes.longURL.S",
  "owner": "$DDBResponse.Attributes.owner.S"
}
```

* Save & deploy.
* ✅ Now you can store short URLs!

#### 2.2 Create GET /direct-ddb/{shortId} API

* Add resource `/direct-ddb/{shortId}` and method `GET`.
* Integration type: AWS Service → DynamoDB → Action: `GetItem`.
* Use this **Request Mapping Template**:

```json
{
  "Key": {
    "shortId": {
      "S": "$input.params().path.shortId"
    }
  },
  "TableName": "URL-Shortener"
}
```

* Use this **Integration Response Mapping Template** to redirect:

```velocity
#set($DDBResponse = $input.path('$'))
#if($DDBResponse.toString().contains("Item"))
  #set($context.responseOverride.header.Location = $DDBResponse.Item.longURL.S)
#end
```

* Set Method Response:

  * Status Code: `302`
  * Header: `Location`
* ✅ Now short URLs redirect users!

---

### Step 3: Deploy Static Website on S3

1. Create an S3 bucket and enable **Static Website Hosting**.
2. Set index document to `index.html`.
3. Upload your frontend files (`index.html` etc.).
4. Adjust bucket policy to allow public read access.
5. Access the website via the S3 endpoint URL.

---

### Step 4: (Optional) Lambda Functions

You can add Lambda functions for more control:

#### Create Short URL Lambda (Node.js)

```javascript
import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";

const dynamodb = new DynamoDBClient({ region: "ca-central-1" });

export const handler = async (event) => {
  const { shortURL, longURL } = event;

  const params = {
    TableName: "URL-Shortener",
    Item: {
      shortId: { S: shortURL },
      longURL: { S: longURL },
      owner: { S: "owner" }
    }
  };

  try {
    await dynamodb.send(new PutItemCommand(params));
    return { statusCode: 200, body: "Successfully created shortURL" };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify(err) };
  }
};
```

#### Retrieve Long URL Lambda (Node.js)

```javascript
import { DynamoDBClient, GetItemCommand } from "@aws-sdk/client-dynamodb";

const dynamodb = new DynamoDBClient({ region: "ca-central-1" });

export const handler = async (event) => {
  const { shortURL } = event;

  const params = {
    TableName: "URL-Shortener",
    Key: { shortId: { S: shortURL } }
  };

  try {
    const response = await dynamodb.send(new GetItemCommand(params));
    if (!response.Item || !response.Item.longURL) {
      return { statusCode: 404, body: JSON.stringify({ error: "Short URL not found" }) };
    }

    return {
      statusCode: 302,
      headers: { Location: response.Item.longURL.S }
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: "Internal Server Error" }) };
  }
};
```

---

## Conclusion

By following this guide, you have built a fully serverless URL shortener using AWS. This solution is:

* Cost-effective
* Highly scalable
* Easy to maintain

Combining Amazon S3, API Gateway, and DynamoDB allows seamless operation without managing servers.

---

Happy coding! 🚀

```

