// JavaScript Assincrono
// await async
// Fullfilled
import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config({ path: new URL("../.env", import.meta.url) });

//const URI =
  //"mongodb+srv://usuario_aqui:aqui@cluster0.4urkt5t.mongodb.net/?appName=Cluster0";
const URI = process.env.MONGODB_URI;
if (!URI) {
  throw new Error("MONGODB_URI não foi definida no arquivo back-end/.env.");
}

const client = new MongoClient(URI);

export const db = client.db("rifllymusical");
// const songCollection = await db.collection("songs").find({}).toArray();

// console.log(songCollection);
