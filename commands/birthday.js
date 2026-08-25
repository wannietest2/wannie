module.exports = async function birthdayCommand(message) {
  const member = message.mentions.members.first();

  if (!member) {
    return message.reply(
      "❌ Tag người mà Wannie cần chúc sinh nhật nhaaa!"
    );
  }

  const name = member.user.username;

  const birthdayMessage =
`Happy Birthday, **${name}**! 🎉

Mong rằng bạn sẽ gặp thật nhiều may mắn, công việc thuận lợi cũng như up R99 ầm ầm >^<
Chúc bạn có một ngày sinh nhật thật vui nhóooo ✨

From Wannie, with love <3`;

  return message.channel.send(birthdayMessage);
};
