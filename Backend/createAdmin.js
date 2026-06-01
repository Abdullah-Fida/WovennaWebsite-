require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./src/models/user.model.js");
const connectDB = require("./src/db/db.js");

const createAdmin = async () => {
  try {
    await connectDB();

    const adminEmail = "admin@woveena.com";
    const adminPassword = "adminpassword123";

    // Check if admin exists
    let adminUser = await User.findOne({ email: adminEmail });
    
    if (adminUser) {
      console.log(`Deleting existing admin to reset password...`);
      await User.deleteOne({ email: adminEmail });
    }

    // Create admin
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);

    adminUser = await User.create({
      name: "Admin",
      email: adminEmail,
      password: hashedPassword,
      role: "admin",
    });

    console.log(`✅ Admin created successfully!`);
    console.log(`Email: ${adminEmail}`);
    console.log(`Password: ${adminPassword}`);
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

createAdmin();
