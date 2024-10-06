import mongoose from "mongoose";

const videoSchema = {
  _id: mongoose.Schema.Types.ObjectId,
  src: String, // Путь к видео
  thumbnail: String, // Путь к миниатюре
  version: Number, // Версия видео
  duration: Number, // Продолжительность видео в секундах
  qualities: [String], // Доступные качества видео
  audio: [String], // Названия аудиодорожек
  subtitles: [String], // Названия субтитров
  files: {
    fragments: Object, // Количество TS-фрагментов
    thumbnails: Number, // Количество склеек миниатюр
  },
  status: String, // 'UPLOADING' - загружается, 'READY' - доступно к просмотру
  managerUserId: mongoose.Schema.Types.ObjectId, // ID менеджера, загружающего видео
  lastUpdateAt: Date, // Дата последнего обновления (для загрузки и удаления)
  verified: {
    // Проверено ли видео на битые файлы
    $type: Boolean,
    default: true,
  },
};

const movieSchema = new mongoose.Schema(
  {
    name: String, // Название
    poster: {
      // Постер
      _id: mongoose.Schema.Types.ObjectId,
      src: String,
    },
    trailer: videoSchema, // Трейлер
    films: [videoSchema], // Фильмы
    series: [[Object]],
    raisedUpAt: Date, // Дата поднятия в списке (для актуальности)
    deletedAt: Date, // Дата удаления
    willPublishedAt: Date, // Планируемая дата публикации
    publishedAt: Date, // Дата публикации (для уже опубликованных фильмов)
    creatorUserId: mongoose.Schema.Types.ObjectId, // ID создателя
  },
  {
    typeKey: "$type",
    timestamps: true,
  }
);

export const Movie = mongoose.model("Movie", movieSchema);
