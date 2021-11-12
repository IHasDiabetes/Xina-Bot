const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9")
const sqlite = require("sqlite3").verbose();
require("dotenv").config();

module.exports = {
    name: "ready",
    once: true,
    execute (client, commands) {
        console.log("Xina is online");

        let db = new sqlite.Database('./ccp.db', (err) => {
            if (err) {
              return console.error(err.message);
            }
            console.log('Connected to the jimmy\'s SQlite database.');
          });
        
          db.run("CREATE TABLE IF NOT EXISTS questions(id INTEGER PRIMARY KEY AUTOINCREMENT, questions STRING, types STRING)")
          db.run("CREATE TABLE IF NOT EXISTS choices(id INTEGER PRIMARY KEY AUTOINCREMENT, questions_id INT, choices STRING, types STRING, FOREIGN KEY (questions_id) REFERENCES questions(id))")
          db.run("CREATE TABLE IF NOT EXISTS user(id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, server_id INTEGER, credit INTEGER DEFAULT 100)")

        const CLIENT_ID = client.user.id;
    
        const rest = new REST({
            version: "9"
        }).setToken(process.env.TOKEN);
    
        (async () => {
            try {
                if (process.env.ENV === "production") {
                    await rest.put(Routes.applicationCommands(CLIENT_ID), {
                        body: commands
                    });
                    console.log("Successfully registered commands globally.");
                } else {
                    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, process.env.GUILD_ID), {
                        body: commands
                    });
                    console.log("Successfully registered commands locally.");
                }
            } catch (err) {
                if (err) console.error(err);
            }
        })();
    }
}