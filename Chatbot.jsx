const sendMessage = async () => {
  if (!message.trim()) return;

  const newChat = [...chat, { role: "user", text: message }];
  setChat(newChat);

  try {
    const res = await fetch("http://localhost:5000/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });

    const data = await res.json();

    setChat([...newChat, { role: "ai", text: data.reply }]);
  } catch (error) {
    console.error(error);
  }

  setMessage("");
};