const { express } = require("./common");
const app = express();
app.use(express.json());
const PORT = 3000;

app.use("/jukebox", require("./api/jukebox"));

app.use((err, req, res, next) => {
  console.error(err.stack); // error log output 
  res.status(500).json({ message: 'Something went wrong.' }); // error response
});

app.listen(PORT, () => {
  console.log(`I am listening on port number ${PORT}`);
});

