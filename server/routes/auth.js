const admin = require("../config/firebase.config");
const user = require("../models/user");

const router = require("express").Router();

router.get("/login", async (req, res) => {
  if (!req.headers.authorization) {
    return res.status(500).send({ message: "Invalid Token" });
  }
  const token = req.headers.authorization.split(" ")[1];
  try {
    const decodeValue = await admin.auth().verifyIdToken(token);
    if (!decodeValue) {
      return res.status(500).json({ message: "Un Authorize" });
    }
    // checking user email already exists or not
    const userExists = await user.findOne({ user_id: decodeValue.user_id });
    if (!userExists) {
      newUserData(decodeValue, req, res);
    } else {
      updateUserData(decodeValue, req, res);
    }
  } catch (error) {
    return res.status(500).json({ message: error });
  }
});

router.put("/favourites/:userId", async (req, res) => {
  const filter = { _id: req.params.userId };
  const songId = req.query;

  try {
    console.log(filter, songId);
    const result = await user.updateOne(filter, {
      $push: { favourites: songId },
    });
    res.status(200).send({ success: true, msg: "Song added to favourites" });
  } catch (error) {
    res.status(400).send({ success: false, msg: error });
  }
});

router.put("/removeFavourites/:userId", async (req, res) => {
  const filter = { _id: req.params.userId };
  const songId = req.query;

  try {
    console.log(filter, songId);
    const result = await user.updateOne(filter, {
      $pull: { favourites: { songId: songId } },
    });
    res
      .status(200)
      .send({ success: true, msg: "Song removed from favourites" });
  } catch (error) {
    res.status(400).send({ success: false, msg: error });
  }
});

const newUserData = async (decodeValue, req, res) => {
  const newUser = new user({
    name: decodeValue.name,
    email: decodeValue.email,
    imageURL: decodeValue.picture,
    user_id: decodeValue.user_id,
    email_verfied: decodeValue.email_verified,
    auth_time: decodeValue.auth_time,
  });
  try {
    const savedUser = await newUser.save();
    res.status(200).send({ user: savedUser });
  } catch (err) {
    res.status(400).send({ success: false, msg: err });
  }
};

const updateUserData = async (decodeValue, req, res) => {
  const filter = { user_id: decodeValue.user_id };
  const options = {
    upsert: true,
    new: true,
  };

  try {
    const result = await user.findOneAndUpdate(
      filter,
      { auth_time: decodeValue.auth_time },
      options
    );
    res.status(200).send({ user: result });
  } catch (err) {
    res.status(400).send({ success: false, msg: err });
  }
};

module.exports = router;
