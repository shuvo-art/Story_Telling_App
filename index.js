const express = require("express");
const app = express();
const dotenv = require("dotenv").config();
const PORT = process.env.PORT || 4000;
const dbConnect = require("./config/dbConnect");
const authRouter = require("./routes/authRoute");
const stationRouter = require("./routes/stationRoute");
const trainRouter = require("./routes/trainRoute");
const walletRouter = require("./routes/walletRoute");
const ticketRouter = require("./routes/ticketRoute");
const { notFound, errorHandler } = require("./middlewares/errorHandler");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const cors = require("cors");

dbConnect();

app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.use(cookieParser());

// Route handling
app.use("/api/user", authRouter);
app.use("/api/station", stationRouter);
app.use("/api/train", trainRouter);
app.use("/api/wallet", walletRouter);
app.use("/api/ticket", ticketRouter);

// Error Handling
app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
