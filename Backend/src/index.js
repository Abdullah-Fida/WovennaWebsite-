const dotenv = require("dotenv");
// Load environment variables FIRST — before any module that reads process.env
dotenv.config();

const connectDB = require("./db/db.js");
const app = require("./app.js");

const PORT = process.env.PORT || 5000;

// Start only after DB is connected (prevents API requests hanging forever)
(async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err.message);
    process.exit(1);
  }
})();
