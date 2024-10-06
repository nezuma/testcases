const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

const app = express();
app.use(express.json());

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: String, // для разграничения прав доступа (например, "admin", "user")
});

const User = mongoose.model("User", userSchema);

const JWT_SECRET = "supersecretkey";

app.post("/register", async (req, res) => {
  const { name, email, password, role } = req.body;

  const user = new User({
    name,
    email,
    password,
    role: role || "user", // По умолчанию обычный пользователь
  });

  try {
    await user.save();
    res.status(201).send({ message: "User registered successfully", user });
  } catch (error) {
    res.status(400).send({ error: "Error registering user" });
  }
});

// Маршрут для входа в систему
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email, password });

  if (!user) {
    return res.status(401).send({ error: "Invalid email or password" });
  }

  // Генерация JWT токена
  const token = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, {
    expiresIn: "1h",
  });

  res.send({ token });
});

// Пример защищенного маршрута
app.get("/admin/users", async (req, res) => {
  const token = req.headers["authorization"];

  if (!token) {
    return res.status(401).send({ error: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).send({ error: "Invalid token" });
    }

    const users = await User.find();
    res.send({ message: "All users", users });
  } catch (error) {
    res.status(401).send({ error: "Invalid token" });
  }
});

mongoose
  .connect("mongodb://localhost/unsafe-auth", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    app.listen(3000, () => {
      console.log("Server is running on port 3000");
    });
  })
  .catch((err) => console.error(err));
