const { prisma, express } = require("../common");
const router = express.Router();
const bcrypt = require("bcrypt");
module.exports = router;
const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET;

router.get("/", (req, res) => {
  res.status(200).json({ message: "This works" });
});

const createToken = (id) => {
    return jwt.sign({ id }, JWT_SECRET, { expiresIn: "8h" });
};


const isLoggedIn = async (req, res, next) => {

    const authHeader = req.headers.authorization;
    const token = authHeader?.slice(7);

    if (!token) return next();

    try {

      const { id } = jwt.verify(token, JWT_SECRET);
      const user = await prisma.user.findFirstOrThrow({
        where: {
          id,
        },
      });
      req.user = user;
      next();
    } catch (error) {
      next(error);
    }
};

router.post("/register", async (req, res, next) => {
    try {
      const { username, password } = req.body;

      const existingUser = await prisma.user.findUnique({
        where: { username },
      });
  
      if (existingUser) {
        return res.status(400).json({ message: "Username already taken" });
      }

      const salt = await bcrypt.genSalt(10);
      const hashPassword = await bcrypt.hash(password, salt);

      const response = await prisma.user.create({
        data: {
          username,
          password: hashPassword,
        },
      });

      if (response.id) {
        const token = createToken(response.id);
        res.status(201).json(token);
      } else {
        res.status(400).json({ message: "Please try again later" });
      }
    } catch (error) {
      next(error);
    }
  });

  /** 
   * test data: test1/test1 or test2/test1
  */
  router.post("/login", async (req, res, next) => {
    try {
      const { username, password } = req.body;


      const user = await prisma.user.findFirstOrThrow({
        where: {
          username,
        },
      });

      const match = await bcrypt.compare(password, user.password);

      if (match) {
        const token = createToken(user.id);
        res.status(201).json(token);
      } else {
        res.status(401).json({ message: "Not Authorized" });
      }
    } catch (error) {
      next(error);
    }
  });

  router.get("/playlists", isLoggedIn, async (req, res, next) => {

    try {

        const response = await prisma.playlist.findMany({
            where: {
                ownerId: +req.user.id,
            },
        });
        res.status(200).json(response);

    } catch (error) {
      next(error);
    }
});

router.post("/playlists", isLoggedIn, async (req, res, next) => {

    try {

        const { name, description, trackIds } = req.body;

        if( !name || !description || !trackIds){
            return res.status(400).json({ message: "Missing required fields" });
        }

        const numTrackIds = trackIds.map((trackId) =>(+trackId));

        const response_tracks = await prisma.track.findMany({
            where: {
                id: { in: numTrackIds },
            },
        });

        if(response_tracks.length !== trackIds.length){
            return res.status(400).json({ message: "Some track(s) do not exist in our database" });
        } 

        const response = await prisma.playlist.create({
            data: {
                name,
                description,
                ownerId: +req.user.id,
                tracks: {
                    connect: numTrackIds.map((trackId) => ({id: trackId})),
                },
            },

        });
        res.status(201).json(response);

    } catch (error) {
      next(error);
    }
});

router.get("/playlists/:id", isLoggedIn, async (req, res, next) => {

  try {

    const { id } = req.params;

      const response = await prisma.playlist.findMany({
          where: {
              ownerId: +req.user.id,
              id: +id,
          },
          include: {
            tracks: true,
          }
      });

      if(response.length === 0) return res.status(403).json(response); //Forbidden error

      res.status(200).json(response);

  } catch (error) {
    next(error);
  }
});

router.get("/tracks", async (req, res, next) => {

  try {

      const response = await prisma.track.findMany();
      res.status(200).json(response);

  } catch (error) {
    next(error);
  }
});

router.get("/tracks/:id", isLoggedIn, async (req, res, next) => {

  try {

    const { id } = req.params;
    let response;

    if(req.user){
        response = await prisma.track.findMany({
        where: { id: +id},
        include: {
          playlists: {
            where: {
              ownerId : +req.user.id,
              tracks: { some: {id: +id}, },
            },
          },
        },
      });
    }else{      
        response = await prisma.track.findFirstOrThrow({
        where: { id: +id},
      });
    }

    if(response.length === 0) return res.status(403).json(response); //Forbidden error
    res.status(200).json(response);

  } catch (error) {
    next(error);
  }
});