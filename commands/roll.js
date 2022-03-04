const sqlite3 = require('sqlite3').verbose();
const { open } = require("sqlite")
const { slashCommandBuilder, SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require('discord.js');
const name = require("emoji-name-map");

const Ones = ["one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten",]

function shuffle(array) {
    let currentIndex = array.length, randomIndex;

    // While there remain elements to shuffle...
    while (currentIndex != 0) {

        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        // And swap it with the current element.
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex], array[currentIndex]];
    }

    return array;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("roll")
        .setDescription("Gamble your hard-earned credits on potential super idols"),
    async execute(interaction) {
        // let question = `SELECT * FROM questions`;

        const user = interaction.member.user;

        const db = await open({
            filename: './ccp.db',
            driver: sqlite3.Database
        })

        const guild_id = interaction.guild.id;

        let player = await db.get(`SELECT * FROM user WHERE user_id = ? AND server_id = ?`, user.id, guild_id);

        const charArray = await db.all(`SELECT ratings, id FROM characters WHERE id in (SELECT characters_id FROM banners_content WHERE banners_id in (SELECT id FROM banners WHERE name = "All Stars"))`);
        // console.log(charArray);

        let charRatings = charArray.map((rating) => {
            return rating["ratings"]
        })

        let charId = charArray.map((id) => {
            return id["id"]
        })

        // console.log(charId);
        let totalRatings = 0
        for (i in charRatings) {
            totalRatings += charRatings[charId[i] - 1];
            // console.log(charId[i]);
            // console.log(totalRatings);
        }

        try {
            
            const poorEmbed = {
                color: 0xde2810,
                title: "Xina is not happy",
                description: 'too poor',
                image: {
                    url: 'https://thumbs.dreamstime.com/z/words-poor-rich-flashcard-cartoon-characters-opposite-adjectives-explanation-card-flat-vector-illustration-isolated-178976690.jpg',
                },
            }

            if (player.credit < 200) {
                await interaction.reply({ embeds: [poorEmbed] });
                return;
            }
            await db.run(`UPDATE user SET credit = ? WHERE user_id = ? AND server_id = ?`, player.credit - 200, user.id, guild_id);

            if ((await db.get(`SELECT * FROM bags WHERE user_id = ? AND banners_id = 1`, player.id) === undefined) || await db.get(`SELECT * FROM bags_content WHERE bags_id = (SELECT id FROM bags WHERE user_id = ? AND banners_id = 1)`, player.id) === undefined) {
                await db.run(`INSERT INTO bags (user_id, banners_id) VALUES (?, 1)`, player.id);
                let bagsId = await db.get(`SELECT id FROM bags WHERE user_id = ? AND banners_id = 1`, player.id);
                // console.log(bagsId);

                for (i in charId) {
                    let charNumbers = (totalRatings / charRatings[charId[i] - 1]);
                    
                    for (let j = 0; j < charNumbers; j++) {
                        // console.log(bagsId);
                        await db.run(`INSERT INTO bags_content (bags_id, characters_id) VALUES (?, ?)`, bagsId["id"], charId[i]);
                    }
                }

            }
            
            let bagsId = await db.get(`SELECT id FROM bags WHERE user_id = ? AND banners_id = 1`, player.id);
            ranId = await db.get(`SELECT id, characters_id FROM bags_content WHERE bags_id = ? ORDER BY random() LIMIT 1`, bagsId["id"])
            bagsContRan = ranId["id"];
            charRanId = ranId["characters_id"];
            console.log(bagsContRan);
            // SELECT characters FROM characters WHERE id in (SELECT characters_id FROM banners_content WHERE banners_id in (SELECT id FROM banners WHERE name = "All Stars"
            await db.run(`DELETE FROM bags_content WHERE id =?`, bagsContRan)
            await db.run(`INSERT INTO collections (user_id, characters_id, character_status) VALUES (?, ?, 0)`, player.id, charRanId)

            const charData = await db.get(`SELECT * FROM characters WHERE id = ?`, charRanId);

            const resultEmbed = {
                color: 0xde2810,
                title: `You Got ${charData["characters"]}!`,
                description: 'To check out your newly earned companion, do `/collections`!',
                image: {
                    url: charData["image_url"],
                },
                timestamp: new Date(),
                footer: {
                    text: 'Xina Not Certified',
                    icon_url: 'https://images-ext-1.discordapp.net/external/WXK7v_Pxt8pL9KvhVRx03gcTu1ekwSr_CtWpnCveDSg/https/cdn.discordapp.com/avatars/904054706010210346/59611d1cbbdba6da9c6f0abf2d2a0c63.webp',
                },
            };

            await interaction.reply({ embeds: [resultEmbed] });

            
        } catch (error) {
            console.error(error)
            interaction.reply({
                content: "Sorry, an error has occured",
                ephemeral: true
            })
        }
    }
}