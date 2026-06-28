#  Mega Team Development® - Advanced Ticket, Welcome & Logs Discord Bot

A multi-functional Discord bot built using **Discord.js v14**. It handles custom advanced ticket creation panels, a unique welcome system with dynamic member banners, and administrative join logs. 

The bot operates continuously in **Idle Mode** with a custom status pointing to `Discord.gg/MEGA`.

---

##  Features

* **Custom Presence:** Keeps the bot in `Idle` status displaying `Discord.gg/MEGA`.
* **Advanced Ticket System:** Create custom tickets routed into sections (*Support*, *Buy Unban*, *Report Cheater*, *CEO Contact*). 
* **Dynamic Welcome Embeds:** Automatically welcomes new users, displaying their avatar neatly on the right panel side alongside server configuration banners.
* **Staff Access Control:** Lock tickets exclusively to the user and a designated Staff role.
* **Persistent Local Storage:** Configuration parameters (`config.json`) are updated dynamically via slash commands and saved instantly.
* **Log System:** Tracks user joins with full metadata (Account Age, User ID, and Mentions).

---

##  Prerequisites

Before hosting, ensure you have the following installed and configured:
* [Node.js](https://nodejs.org/) v16.11.0 or higher.
* A Discord Bot Token with **All Gateway Intents Enabled** (*Guild Members*, *Message Content*, *Guild Messages*) inside the [Discord Developer Portal](https://discord.com/developers/applications).

---

##  Installation & Setup

1. **Download Project Files:** Ensure `index.js`, `package.json`, and `config.json` are placed in the same directory.
2. **Install Dependencies:** Open your terminal in the project directory and execute:
   ```bash
   npm install
   node index.js
