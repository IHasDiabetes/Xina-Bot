const sqlite3 = require('sqlite3').verbose();
const { open } = require("sqlite")
const { slashCommandBuilder, SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require('discord.js');
const name = require("emoji-name-map");


module.exports = {
    data: new SlashCommandBuilder()
        .setName("profile")
        .setDescription("Shows your stats!"),
    async execute(interaction) {

        const user = interaction.member.user;

        const db = await open({
            filename: './ccp.db',
            driver: sqlite3.Database
        })

        const guild_id = interaction.guild.id;
        console.log(guild_id);

        try {
            if (await db.get(`SELECT user_id FROM user WHERE user_id = ? AND server_id = ?`, user.id, guild_id) === undefined) {
                await db.run(`INSERT INTO user (user_id, server_id) VALUES (?, ?)`, user.id, guild_id)
            }

            let player = await db.get(`SELECT * FROM user WHERE user_id = ? AND server_id = ?`, user.id, guild_id);
            // console.log(player.credit);

            let avg_credit = await db.get(`SELECT avg(credit), COUNT(id) FROM user WHERE server_id = ?`, guild_id);
            console.log(avg_credit)

            let response = ""
            if (player.credit < avg_credit["avg(credit)"] - (10 * avg_credit["COUNT(id)"])) {
                response = "Your death is near"
            }
            else if (player.credit > avg_credit["avg(credit)"] + (10 * avg_credit["COUNT(id)"])){
                response = "Jong Xina is proud of you"
            }
            else {
                response = "You can do better..."
            }

            const profileEmbed = {
                color: 0xde2810,
                title: user.username,
                description: response,
                thumbnail: {
                    url: `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=256`,
                },
                fields: [
                    {
                        name: 'Social Credit Score:',
                        value: `${player.credit}`,
                    },
                ],
                timestamp: new Date(),
                footer: {
                    text: 'Xina Certified',
                    icon_url: 'https://images-ext-1.discordapp.net/external/WXK7v_Pxt8pL9KvhVRx03gcTu1ekwSr_CtWpnCveDSg/https/cdn.discordapp.com/avatars/904054706010210346/59611d1cbbdba6da9c6f0abf2d2a0c63.webp',
                },
            };

            const message = await interaction.reply({
                embeds: [profileEmbed],
                fetchReply: true
                // ephemeral: true,
            });
            
        } catch (error) {
            console.error(error)
            interaction.reply({
                content: "Sorry, profile unavailable",
                ephemeral: true
            })
        }
    }
}