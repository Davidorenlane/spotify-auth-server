require("dotenv").config();
const express = require("express");
const axios = require("axios");

const app = express();

// Parse both JSON and x-www-form-urlencoded bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const {
  SPOTIFY_CLIENT_ID,
  SPOTIFY_CLIENT_SECRET,
  SPOTIFY_REDIRECT_URI,
  PORT = 1234,
} = process.env;

if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET || !SPOTIFY_REDIRECT_URI) {
  console.error("Missing Spotify env vars. Check .env file.");
  process.exit(1);
}

app.get("/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

app.post("/swap", async (req, res) => {
  try {
    const code = req.body.code;
    if (!code) {
      return res.status(400).json({ error: "Missing code in request body" });
    }

    const authHeader = Buffer.from(
      `${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`
    ).toString("base64");

    const params = new URLSearchParams();
    params.append("grant_type", "authorization_code");
    params.append("code", code);
    params.append("redirect_uri", SPOTIFY_REDIRECT_URI);

    const tokenResponse = await axios.post(
      "https://accounts.spotify.com/api/token",
      params.toString(),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${authHeader}`,
        },
      }
    );

    res.json(tokenResponse.data);
  } catch (err) {
    console.error("Error in /swap:", err.response?.data || err.message);
    res.status(500).json({
      error: "Token swap failed",
      details: err.response?.data || err.message,
    });
  }
});

app.post("/refresh", async (req, res) => {
  try {
    const refreshToken = req.body.refresh_token || req.body.refreshToken;
    if (!refreshToken) {
      return res.status(400).json({ error: "Missing refresh_token in body" });
    }

    const authHeader = Buffer.from(
      `${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`
    ).toString("base64");

    const params = new URLSearchParams();
    params.append("grant_type", "refresh_token");
    params.append("refresh_token", refreshToken);

    const tokenResponse = await axios.post(
      "https://accounts.spotify.com/api/token",
      params.toString(),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${authHeader}`,
        },
      }
    );

    res.json(tokenResponse.data);
  } catch (err) {
    console.error("Error in /refresh:", err.response?.data || err.message);
    res.status(500).json({
      error: "Token refresh failed",
      details: err.response?.data || err.message,
    });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Spotify auth server listening on port ${PORT}`);
});
