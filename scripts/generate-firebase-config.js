const fs = require("fs");
require("dotenv").config();

const dbName = process.env.FIREBASE_DB_NAME || "(default)";

const config = {
    functions: {
        source: "functions",
        predeploy: [
            "npm --prefix \"$RESOURCE_DIR\" run build"
        ],
        ignore: [
            "node_modules",
            ".git",
            "firebase-debug.log",
            "firebase.json"
        ]
    },
    firestore: {
        database: dbName,
        rules: "firestore.rules",
        indexes: "firestore.indexes.json"
    }
};

fs.writeFileSync("firebase.json", JSON.stringify(config, null, 2));
console.log("🔥 firebase.json created:", dbName);
