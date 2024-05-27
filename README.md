# E-HISOBCHI Attendance Bot

Welcome to the E-HISOBCHI Attendance Bot repository! This bot is designed to facilitate and automate the attendance-taking process for teachers at the Educational Center. It helps in managing teacher information, group details, and salary information while providing timely reminders for attendance.

## 🛠️ Technologies Used

- **Node.js**: A powerful runtime environment for executing JavaScript code on the server-side.
- **Express**: A minimal and flexible Node.js web application framework.
- **node-cron**: A task scheduler in pure JavaScript for Node.js based on GNU crontab.
- **node-telegram-bot-api**: A Telegram Bot API for Node.js.
- **Axios**: A promise-based HTTP client for the browser and Node.js.
- **dotenv**: A zero-dependency module that loads environment variables from a `.env` file into `process.env`.
- **Winston**: A versatile logging library for Node.js.

## ✨ Features

- **User Authentication**: Secure user authentication through phone number and password setup, verified via the [E-HISOBCHI](http://e-hisobchi.uz)
 backend API.
- **Inline Keyboard Navigation**: Easy access to account information, group details, and salary information.
  - **Account Information**: View personal details such as name, phone number, and date of birth.
  - **Group Details**: Access assigned groups, course details, and student lists.
  - **Attendance Management**: Mark student attendance for each class, with present or absent options.
  - **Salary Information**: Check salary percentage and current balance.
- **Automated Reminders**: 
  - Sends reminders to take attendance 10 minutes before each class start time.
  - Ensures reminders are only sent on days when the class is scheduled.
- **Error Handling**: Robust error handling and logging using Winston.

## 📝 License

This project is licensed under the ISC License. See the [LICENSE](LICENSE) file for details.

---

[![Made with Node.js](https://img.shields.io/badge/Made_with-Node.js-68A063?style=for-the-badge&logo=node.js)](https://nodejs.org/)
[![Made with Express.js](https://img.shields.io/badge/Made_with-Express.js-000000?style=for-the-badge&logo=express)](https://expressjs.com/)
[![Made with node-cron](https://img.shields.io/badge/Made_with-node--cron-000000?style=for-the-badge&logo=cron)](https://www.npmjs.com/package/node-cron)
[![Made with node-telegram-bot-api](https://img.shields.io/badge/Made_with-node--telegram--bot--api-0088CC?style=for-the-badge&logo=telegram)](https://www.npmjs.com/package/node-telegram-bot-api)
[![Made with Axios](https://img.shields.io/badge/Made_with-Axios-5A29E4?style=for-the-badge&logo=axios)](https://axios-http.com/)
[![Made with dotenv](https://img.shields.io/badge/Made_with-dotenv-ECD53F?style=for-the-badge&logo=dotenv)](https://www.npmjs.com/package/dotenv)
[![Made with Winston](https://img.shields.io/badge/Made_with-Winston-FFDA44?style=for-the-badge&logo=winston)](https://github.com/winstonjs/winston)