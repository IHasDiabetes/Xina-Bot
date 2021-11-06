const { slashCommandBuilder, SlashCommandBuilder } = require("@discordjs/builders");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("questions")
        .setDescription("Asks a question"),
    async execute(interaction) {
        const message = await interaction.reply({
            content: "this is a test question",
            fetchReply: true
            // ephemeral: true,
        });
        message.react('👌');
        message.react('😊');
        message.react('❤');
    }
}