const { slashCommandBuilder, SlashCommandBuilder } = require("@discordjs/builders");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("test")
        .setDescription("Verifies this shit works"),
    async execute(interaction) {
        interaction.reply({
            content: "Holy fucking shit it works?!",
            // ephemeral: true
        });
    }
}