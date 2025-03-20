// Runtime Node.js 22.x, Handler index.handler, Architecture x86_64
import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";

const dynamodb = new DynamoDBClient({ region: "ca-central-1" });

export const handler = async (event) => {
  console.log("Input to the Lambda function", event);

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
    const data = await dynamodb.send(new PutItemCommand(params));
    console.log("Response post create", data);
    return { statusCode: 200, body: "Successfully created shortURL" };
  } catch (err) {
    console.error("Error", err);
    return { statusCode: 500, body: JSON.stringify(err) };
  }
};