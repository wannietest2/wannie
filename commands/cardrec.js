const { EmbedBuilder } = require("discord.js");
const getColor = require("../utils/colors");

module.exports = async function cardrecCommand(message) {
  const embed = new EmbedBuilder()
    .setColor(getColor())

    .setTitle("R99 Card Upgrade Recommendation")

    .setDescription(
`A1 > A5 use C1 cards
S1 > S5 preferably use B1, or C1 cards

R1 > R41 use C1 cards
(R31 > R41 use B1 if you have many)

R41 > R71 use B1 cards
(R61 > R71 can use A1 if you have many)

R71 > R81 use A5

R81 > R91 use S5 (or A5 if you run out)

R91 > R99 use MAINLY PUC% (or R1 or S5)`
    )

    .setFooter({
      text: message.author.username,
      iconURL: message.author.displayAvatarURL({ dynamic: true })
    });

  return message.reply({
    embeds: [embed]
  });
};
