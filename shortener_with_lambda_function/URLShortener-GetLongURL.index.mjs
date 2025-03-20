// Runtime Node.js 22.x, Handler index.handler, Architecture x86_64
import { DynamoDBClient, GetItemCommand } from "@aws-sdk/client-dynamodb";

const dynamodb = new DynamoDBClient({ region: "ca-central-1" });

export const handler = async (event) => {
  console.log("Input to the Lambda function", event);

  const { shortURL } = event;

  const params = {
    TableName: "URL-Shortener",
    Key: {
      shortId: { S: shortURL }
    }
  };

  try {
    const response = await dynamodb.send(new GetItemCommand(params));
    
    if (!response.Item || !response.Item.longURL) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "Short URL not found" })
      };
    }

    console.log("Response from DDB", response);
    
    return {
      statusCode: 302,
      headers: {
        Location: response.Item.longURL.S
      }
    };

  } catch (err) {
    console.error("Error while fetching data from DDB", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal Server Error" })
    };
  }
};
