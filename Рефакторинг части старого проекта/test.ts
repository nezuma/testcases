import { MoviePageLog } from "./movie-page-log.model";
import { Movie } from "./movie.model";

const handler = async (req, res) => {
  const skip = +req.query.skip || 0;
  const limit = +(req.query.limit > 0 && req.query.limit <= 100
    ? req.query.limit
    : 100);

  const dateFilterParam = req.query.start && {
    $and: [
      { createdAt: { $gte: new Date(req.query.start) } },
      { createdAt: { $lt: new Date(req.query.end || new Date()) } },
    ],
  };

  const searchMoviesMatch = req.RegExpQuery && {
    name: req.RegExpQuery,
  };

  try {
    // Получить все материалы, среди которых нужно искать
    const movies = await Movie.find(
      { ...searchMoviesMatch },
      {
        name: true,
        poster: { src: true },
        alias: true,
        publishedAt: true,
      }
    ).lean();

    // Получить ID материалов, среди которых выполнять поиск
    const movieIds = movies.map((movie) => movie._id);

    // Параллельно получить информацию (для оптимизации)
    const [totalSize, items] = await Promise.all([
      MoviePageLog.find({
        ...dateFilterParam,
        movieId: { $in: movieIds },
      }).countDocuments(),
      MoviePageLog.aggregate([
        {
          $match: { ...dateFilterParam, movieId: { $in: movieIds } },
        },
        { $sort: { updatedAt: -1 } },
        { $skip: skip },
        { $limit: limit },
        {
          $project: {
            _id: true,
            userId: true,
            movieId: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            pipeline: [
              {
                $project: {
                  role: true,
                  avatar: true,
                  firstname: true,
                  banned: true,
                  tariffId: "$subscribe.tariffId",
                  phone: "$authPhone",
                },
              },
              {
                $lookup: {
                  from: "tariffs",
                  localField: "tariffId",
                  foreignField: "_id",
                  pipeline: [{ $project: { name: true } }],
                  as: "tariff",
                },
              },
              {
                $unwind: {
                  path: "$tariff",
                  preserveNullAndEmptyArrays: true,
                },
              },
              {
                $project: {
                  tariffName: "$tariff.name",
                  role: true,
                  avatar: true,
                  firstname: true,
                  phone: true,
                  banned: true,
                },
              },
              {
                $addFields: {
                  isBanned: {
                    $cond: {
                      if: {
                        $and: [
                          { $ne: ["$banned", null] },
                          {
                            $or: [
                              { $eq: ["$banned.finishAt", null] },
                              { $gt: ["$banned.finishAt", new Date()] },
                            ],
                          },
                        ],
                      },
                      then: true,
                      else: false,
                    },
                  },
                },
              },
            ],
            as: "user",
          },
        },
        { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
      ]),
    ]);

    // Добавить к элементам информацию о фильмах, удалить ненужные данные
    items.forEach((item) => {
      item.movie = movies.find(
        (movie) => movie._id.toString() === item.movieId.toString()
      );

      delete item.userId;
      delete item.movieId;
    });

    return res.status(200).json({
      totalSize,
      items,
    });
  } catch (err) {
    return res.status(200).send({
      type: "error",
      message: "Непредвиденная ошибка",
    });
  }
};
