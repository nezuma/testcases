import mongoose from "mongoose";

const moviePageLogSchema = new mongoose.Schema(
  {
    device: Object,
    referer: String,
    startTime: Number,
    endTime: Number,
    deletionDate: Date,
    quality: String,
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      index: true,
    },
    movieId: {
      type: mongoose.Schema.Types.ObjectId,
      index: true,
      ref: "Movie",
    },
    videoId: {
      type: mongoose.Schema.Types.ObjectId,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export const MoviePageLog = mongoose.model("MoviePageLog", moviePageLogSchema);
