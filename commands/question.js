const sqlite3 = require('sqlite3').verbose();
const { open } = require("sqlite")
const { slashCommandBuilder, SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require('discord.js');
const name = require("emoji-name-map");

const Ones  = ["one","two","three","four","five","six","seven","eight","nine","ten",]

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
        .setName("question")
        .setDescription("Asks a question, respond with reactions"),
    async execute(interaction) {
        let question = `SELECT * FROM questions`;

        const user = interaction.member.user;

        const db = await open({
            filename: './ccp.db',
            driver: sqlite3.Database
        })

        const guild_id = interaction.guild.id;

        const row = await db.all(question)

        // console.log(question)
        // console.log("===================")
        // console.log(row);

        const randomed = row[Math.floor(Math.random() * row.length)]
        console.log("rolled: ", randomed.id);

        try {
            let answer = await db.get(`SELECT * FROM choices WHERE questions_id = ?`, randomed.id);
            let choices = await db.all(`SELECT * FROM choices WHERE types = ? AND choices != ? ORDER BY random() LIMIT 3;  `, randomed.types, answer.choices);

            // console.log(await db.get(`SELECT user_id FROM user WHERE user_id = ?`, user.id));
            if (await db.get(`SELECT user_id FROM user WHERE user_id = ? AND server_id = ?`, user.id, guild_id) === undefined) {
                await db.run(`INSERT INTO user (user_id, server_id) VALUES (?, ?)`, user.id, guild_id)
            }

            let player = await db.get(`SELECT * FROM user WHERE user_id = ? AND server_id = ?`, user.id, guild_id);
            console.log(player);

            choices.push(answer)
            shuffle(choices);

            let correctReaction = ""
            let mixed = choices.map((choice, index) => {
                if (choice.id === answer.id) {
                    correctReaction = `:${Ones[index]}:`
                }
                return {
                    name: "======",
                    value: `:${Ones[index]}: ${choice.choices}`,
                }
            })

            const questionEmbed = {
                color: 0xde2810,
                title: randomed.questions,
                description: 'React to answer this question. Do not disappoint!',
                fields: mixed,
                timestamp: new Date(),
                footer: {
                    text: 'Xina Certified',
                    icon_url: 'https://images-ext-1.discordapp.net/external/WXK7v_Pxt8pL9KvhVRx03gcTu1ekwSr_CtWpnCveDSg/https/cdn.discordapp.com/avatars/904054706010210346/59611d1cbbdba6da9c6f0abf2d2a0c63.webp',
                },
            };

            const correctEmbed = {
                color: 0xc7e37c,
                title: `Well done ${user.username}, Jong Xina is proud`,
                description: '+10 social credit score',
                image: {
                    url: 'https://cdn.discordapp.com/attachments/653955775127093250/908026390622904391/unknown.png',
                },
                timestamp: new Date(),
                footer: {
                    text: 'Xina Certified',
                    icon_url: `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=256`,
                },
            };

            const timeEmbed = {
                color: 0xde2810,
                title: "Not fast enough",
                description: '-5 social credit score',
                image: {
                    url: 'https://c.tenor.com/IU3SbooHGWkAAAAC/wok-the-wock.gif',
                },
                timestamp: new Date(),
                footer: {
                    text: 'Xina Certified',
                    icon_url: 'https://images-ext-1.discordapp.net/external/WXK7v_Pxt8pL9KvhVRx03gcTu1ekwSr_CtWpnCveDSg/https/cdn.discordapp.com/avatars/904054706010210346/59611d1cbbdba6da9c6f0abf2d2a0c63.webp',
                },
            };

            const incorrectEmbed = {
                color: 0xde2810,
                title: "Your execution date is determined",
                description: '-15 social credit score',
                image: {
                    url: 'https://img-comment-fun.9cache.com/media/a2r8VjD/aproxRgY_700w_0.jpg',
                },
                timestamp: new Date(),
                footer: {
                    text: 'Xina Certified',
                    icon_url: 'https://images-ext-1.discordapp.net/external/WXK7v_Pxt8pL9KvhVRx03gcTu1ekwSr_CtWpnCveDSg/https/cdn.discordapp.com/avatars/904054706010210346/59611d1cbbdba6da9c6f0abf2d2a0c63.webp',
                },
            };

            const message = await interaction.reply({
                embeds: [questionEmbed],
                fetchReply: true
                // ephemeral: true,
            });
            try {
                message.react('1️⃣');
                message.react('2️⃣');
                message.react('3️⃣');
                message.react('4️⃣');
            } catch (error) {
                message.reply({
                    content: "Sorry, an error occured",
                    // ephemeral: true
                })
            }
            const filter = (reaction, user) => {
                return ['1️⃣', '2️⃣', '3️⃣', '4️⃣'].includes(reaction.emoji.name) && user.id === interaction.user.id;
            };

            message.awaitReactions({ filter, max: 1, time: 60000, errors: ['time'] })
                .then(collected => {
                    // console.log(collected);
                    const reaction = collected.first();

                    if (reaction.emoji.name === name.get(correctReaction)) {
                        interaction.followUp({embeds: [correctEmbed]});
                        db.run(`UPDATE user SET credit = ? WHERE user_id = ? AND server_id = ?`, player.credit + 10, user.id, guild_id);
                    } else {
                        interaction.followUp({embeds: [incorrectEmbed]});
                        db.run(`UPDATE user SET credit = ? WHERE user_id = ? AND server_id = ?`, player.credit - 15, user.id, guild_id);
                    }
                })
                .catch(collected => {
                    message.reply({embeds: [timeEmbed]});
                    db.run(`UPDATE user SET credit = ? WHERE user_id = ? AND server_id = ?`, player.credit - 5, user.id, guild_id);
                });
        } catch (error) {
            console.error(error)
            interaction.reply({
                content: "Sorry, question unavailable",
                ephemeral: true
            })
        }
    }
}