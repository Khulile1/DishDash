// Import mongoose so we can connect the backend to MongoDB
const mongoose = require("mongoose");

// Import Node DNS
const dns = require("node:dns");

// Force Node to use working DNS servers
dns.setServers([
  "8.8.8.8",
  "1.1.1.1",
]);

// Function responsible for connecting to the MongoDB database
const connectDB = async () => {
  try {
    // Get the MongoDB connection string from the .env file
    const mongoUri = process.env.MONGO_URI;

    // Check if MONGO_URI exists
    if (!mongoUri) {
      throw new Error(
        "MONGO_URI is missing in .env file"
      );
    }

    // Show which DNS servers Node is using
    console.log(
      "Node DNS servers:",
      dns.getServers()
    );

    // Connect to MongoDB
    await mongoose.connect(mongoUri);

    console.log("MongoDB connected");
  } catch (error) {
    console.error(
      "MongoDB connection failed:",
      error.message
    );

    process.exit(1);
  }
};

// Export connectDB so it can be used in server.js
module.exports = connectDB;