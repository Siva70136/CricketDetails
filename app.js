const express = require("express");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const path = require("path");
const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "cricketMatchDetails.db");
let db = null;

const initializeDb = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(4000);
    console.log("server is created http://localhost:4000");
  } catch (e) {
    console.log(`error message ${e.message}`);
  }
};

initializeDb();

const convertResponsePlayer = (dataObj) => {
  return {
    playerId: dataObj.player_id,
    playerName: dataObj.player_name,
  };
};

const convertResponseMatchDetails = (dataObj) => {
  return {
    matchId: dataObj.match_id,
    match: dataObj.match,
    year: dataObj.year,
  };
};

const convertResponsePlayerScores = (dataObj) => {
  return {
    playerId: dataObj.playerId,
    playerName: dataObj.playerName,
    totalScore: dataObj.totalScore,
    totalFours: dataObj.totalFours,
    totalSixes: dataObj.totalSixes,
  };
};

app.get("/players/", async (req, res) => {
  const getQuery = `select * from player_details;`;
  const getData = await db.all(getQuery);
  res.send(getData.map((eachPlayer) => convertResponsePlayer(eachPlayer)));
});

app.get("/players/:playerId/", async (req, res) => {
  const { playerId } = req.params;
  const getQuery = `select * from player_details where player_id=${playerId};`;
  const getData = await db.get(getQuery);
  res.send(convertResponsePlayer(getData));
});

app.put("/players/:playerId/", async (req, res) => {
  const { playerId } = req.params;
  const { playerName } = req.body;
  const putQuery = `UPDATE player_details SET player_name='${playerName}' where player_id=${playerId};`;
  const getData = await db.run(putQuery);
  res.send("Player Details Updated");
});

app.get("/matches/:matchId/", async (req, res) => {
  const { matchId } = req.params;
  const getQuery = `select * from match_details where match_id=${matchId};`;
  const getData = await db.get(getQuery);
  res.send(convertResponseMatchDetails(getData));
});

app.get("/players/:playerId/matches", async (req, res) => {
  const { playerId } = req.params;

  const getQuery = `select * from player_match_score NATURAL JOIN match_details WHERE player_id=${playerId};`;
  const getData = await db.all(getQuery);

  res.send(
    getData.map((eachPlayer) => convertResponseMatchDetails(eachPlayer))
  );
});

app.get("/matches/:matchId/players", async (req, res) => {
  const { matchId } = req.params;

  const getQuery = `select * from player_match_score NATURAL JOIN player_details WHERE match_id=${matchId};`;
  const getData = await db.all(getQuery);

  res.send(getData.map((eachPlayer) => convertResponsePlayer(eachPlayer)));
});

app.get("/players/:playerId/playerScores", async (req, res) => {
  const { playerId } = req.params;

  const query = `SELECT
    player_details.player_id AS playerId,
    player_details.player_name AS playerName,
    SUM(player_match_score.score) AS totalScore,
    SUM(fours) AS totalFours,
    SUM(sixes) AS totalSixes FROM 
    player_details INNER JOIN player_match_score ON
    player_details.player_id = player_match_score.player_id
    WHERE player_details.player_id = ${playerId};
    `;
  const getData = await db.get(query);
  res.send(convertResponsePlayerScores(getData));
});

module.exports = app;
