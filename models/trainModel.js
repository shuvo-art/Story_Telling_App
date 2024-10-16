const mongoose = require("mongoose");

const trainSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    stops: [
      {
        station: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Station",
        },
        arrivalTime: {
          type: String,
          required: true,
        },
        departureTime: {
          type: String,
          required: true,
        },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Train", trainSchema);
