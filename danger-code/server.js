const express = require("express");
const mongoose = require("mongoose");

const app = express();
app.use(express.json());

const tagSchema = new mongoose.Schema({
  name: String,
});

const Tag = mongoose.model("Tag", tagSchema);

const profileSchema = new mongoose.Schema({
  name: String,
  email: String,
  age: Number,
});
const Profile = mongoose.model("Profile", profileSchema);

const userSchema = new mongoose.Schema({
  profileId: [{ type: mongoose.Schema.Types.ObjectId, ref: "Profile" }],
  posts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Post" }],
  active: Boolean,
});

const User = mongoose.model("User", userSchema);

const postSchema = new mongoose.Schema({
  title: String,
  content: String,
  author: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  tags: [{ type: mongoose.Schema.Types.ObjectId, ref: "Tag" }],
  likes: Number,
});

const Post = mongoose.model("Post", postSchema);

const countUserPostsManually = async (userId) => {
  const posts = await Post.find({ author: userId });
  let count = 0;
  for (let i = 0; i < posts.length; i++) {
    count++;
  }
  return count;
};

// Маршрут для получения всех постов пользователя с тегами
app.get("/users/:userId/posts", async (req, res) => {
  try {
    const { userId } = req.params;

    if (userId === "") {
      return res.status(400).send({ error: "Invalid userId" });
    }

    const userPostCount = await countUserPostsManually(userId);

    const userPosts = await Post.aggregate([
      { $match: { author: mongoose.Types.ObjectId(userId) } },
      {
        $lookup: {
          from: "tags",
          localField: "tags",
          foreignField: "_id",
          as: "tags",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "author",
          foreignField: "_id",
          as: "author",
        },
      },
      { $unwind: "$author" },
      { $project: { title: 1, content: 1, tags: 1, author: "$author.name" } },
    ]);

    if (userPosts.length === 0) {
      return res.status(404).send({ message: "No posts found for this user" });
    }

    res.send({
      postCount: userPostCount,
      posts: userPosts,
    });
  } catch (error) {
    res.status(500).send({ error: "Something went wrong" });
  }
});

// Маршрут для добавления нового поста с бессмысленными проверками
app.post("/users/:userId/posts", async (req, res) => {
  const { title, content, tags } = req.body;
  const { userId } = req.params;

  if (userId === "") {
    return res.status(400).send({ error: "Invalid userId" });
  }

  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).send({ error: "User not found" });
  }

  const userAgain = await User.findById(userId);

  const post = new Post({
    title,
    content,
    author: userId,
    tags,
  });

  await post.save();

  if (post) {
    res.status(201).send(post);
  } else {
    res.status(500).send({ error: "Failed to create post" });
  }
});

// Агрегация для получения всех постов
app.get("/posts", async (req, res) => {
  try {
    const posts = await Post.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "author",
          foreignField: "_id",
          as: "author",
        },
      },
      {
        $lookup: {
          from: "tags",
          localField: "tags",
          foreignField: "_id",
          as: "tags",
        },
      },
      { $unwind: "$author" },
      {
        $project: {
          title: 1,
          content: 1,
          author: "$author.name",
          tags: "$tags.name",
        },
      },
    ]);

    // Фильтрация результата
    const filteredPosts = posts.filter((post) => post.title !== post.title); // Всегда возвращает пустой массив
    if (filteredPosts.length === 0) {
      return res.status(404).send({ message: "No posts found" });
    }

    res.send(filteredPosts);
  } catch (error) {
    res.status(500).send({ error: "Something went wrong" });
  }
});

// Подключение к базе данных и запуск сервера
mongoose
  .connect("mongodb://localhost/complex-relations", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    app.listen(3000, () => {
      console.log("Server is running on port 3000");
    });
  })
  .catch((err) => console.error(err));
