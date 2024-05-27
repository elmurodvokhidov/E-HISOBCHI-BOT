const TelegramBot = require('node-telegram-bot-api');
const winston = require('winston');
const cron = require('node-cron');
const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });
const api = require('../config/api');
const specialTxt = require('../config/text');

// Bot buyruq sozlamasi
bot.setMyCommands([
    { command: '/start', description: "Botni qayta ishga tushirish" },
    { command: '/info', description: "Bot imkoniyatlari haqida" }
]);

// O'qituvchi ma'lumoti
const teachers = {};
let token = null;

// Add a request interceptor
api.interceptors.request.use((req) => {
    if (token) {
        req.headers.Authorization = token;
    }
    return req;
});

// Asosiy menu ko'rinishi
const showMainMenu = async (chatId) => {
    bot.sendMessage(chatId, "Quyidagi bo'limlardan birini tanlang:", {
        reply_markup: {
            inline_keyboard: [
                [{ text: "Hisob ma'lumotlari", callback_data: "account" }],
                [{ text: "Mening guruhlarim", callback_data: "groups" }],
                [{ text: "Ish haqi", callback_data: "salary" }],
            ]
        }
    });
};

// Bugungi sanani olish
const getCurrentDate = async () => {
    const { data } = await api.get("get-current-date");
    return data;
};

// Davomat olishni eslatuvchi funksiya
const sendAttendanceReminder = async (teacher, group) => {
    const message = `${teacher.first_name.toUpperCase()} "${group.name.toUpperCase()}" - guruhingiz uchun davomat olishni unutmang!`;
    await bot.sendMessage(teacher.chatId, message);
};

// O'qituvchi ma'lumotlarini olish funksiyasi
const getTeacherByChatIdFunction = async (chatId) => {
    const { data } = await api.get(`/teacher/get-teacher-by-chatid/${chatId}`);
    teachers[chatId] = data.data;
    token = data.data.token;
};

// Barcha o'qituvchilarni olish funksiyasi
const getAllTeachersFunction = async () => {
    try {
        const { data } = await api.get("/admin/get-all-teacher");
        return data;
    } catch (error) {
        winston.error(error.message);
    }
};

// Function to handle attendance updates
const handleCheckboxChange = async (student, date, present, groupId, query) => {
    try {
        try { await api.put(`/admin/calc-teacher-salary/${student}/${date}`) }
        catch (error) { console.log(error.response?.data.message || error.message) }
        try {
            await api.post(`/admin/check-attendance/${groupId}`, { student, date, present });
            await bot.answerCallbackQuery(query.id, { text: `Davomat yangilandi!` });
        }
        catch (error) { bot.answerCallbackQuery(query.id, { text: `Davomatni yangilab bo'lmadi!` }) }
    } catch (error) {
        console.error("Error updating attendance:", error.response?.data.message || error.message);
    }
};

// Botga /start buyrug'i kelsa
bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    try {
        await getTeacherByChatIdFunction(chatId);
        showMainMenu(chatId);
    } catch (error) {
        winston.info(error.response.data.message);
        bot.sendMessage(chatId, "Hisobingizga kirish uchun telefon raqamingizni ulashing!", { reply_markup: { keyboard: [[{ text: "Telefon raqamini ulashish", request_contact: true }]], one_time_keyboard: true, resize_keyboard: true } });
    }
});

// Botga /info buyrug'i kelsa
bot.onText(/\/info/, async (msg) => {
    const chatId = msg.chat.id;
    try {
        bot.sendMessage(chatId, specialTxt);
    } catch (error) {
        console.error(`Failed to process /info command: ${error.message}`);
        bot.sendMessage(chatId, "Sorry, an error occurred while processing your request.");
    }
});

// // Agar contact share qilinsa
bot.on('contact', async (msg) => {
    const chatId = msg.chat.id;
    let phoneNumber = msg.contact.phone_number;
    if (phoneNumber) {
        phoneNumber = phoneNumber.split('+').join('').slice(3);
        teachers[chatId] = { phoneNumber };
        bot.sendMessage(chatId, "Parolingizni kiriting:", { reply_markup: { remove_keyboard: true } });
    } else {
        bot.sendMessage(chatId, "Nimadir xato! \nQayta urinib ko'ring 👉 /start");
    }
});

// Parol kiritilsa
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const password = msg.text;

    if (teachers[chatId] && teachers[chatId].phoneNumber && !teachers[chatId].password) {
        teachers[chatId].password = password;
        const { phoneNumber } = teachers[chatId];
        const loadingMessage = await bot.sendMessage(chatId, 'Yuklanmoqda...');
        try {
            const { data } = await api.put(`/teacher/update-teacher-by-chatid/${phoneNumber}`, { chatId, password });
            teachers[chatId] = data.data;
            token = data.data.token;
            bot.editMessageText(`Salom, ${data.data.first_name.toUpperCase()} 👋 \nQuyidagi bo'limlardan birini tanlang:`, { chat_id: chatId, message_id: loadingMessage.message_id, reply_markup: { inline_keyboard: [[{ text: "Hisob ma'lumotlari", callback_data: "account" }], [{ text: "Mening guruhlarim", callback_data: "groups" }], [{ text: "Ish haqi", callback_data: "salary" }]] } });
        } catch (error) {
            console.error('Error during API call:', error);
            winston.info(error.response?.data?.message || error.message);
            bot.editMessageText("Telefon raqami yoki parol xato! \nTekshirib qayta urinib ko'ring 👉 /start", {
                chat_id: chatId,
                message_id: loadingMessage.message_id
            });
        }
    }
});

// // Barcha inline tugmalarni boshqarish
bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const messageId = query.message.message_id;
    const callbackData = query.data;
    const { today } = await getCurrentDate();

    // await bot.editMessageText('Yuklanmoqda...', {
    //     chat_id: chatId,
    //     message_id: messageId
    // });

    if (teachers[chatId]) {
        try {
            switch (callbackData) {
                case 'account':
                    await getTeacherByChatIdFunction(chatId);
                    const teacher = teachers[chatId];
                    bot.editMessageText(`Ism: ${teacher.first_name.toUpperCase()} ${teacher.last_name.toUpperCase()}\nTelefon: ${teacher.phoneNumber}\nTug'ilgan sana: ${teacher.dob}`, {
                        chat_id: chatId,
                        message_id: messageId,
                        reply_markup: {
                            inline_keyboard: [
                                [{ text: "Ortga qaytish", callback_data: "back" }]
                            ]
                        }
                    });
                    break;
                case 'groups':
                    await getTeacherByChatIdFunction(chatId);
                    const groups = teachers[chatId].groups;
                    if (groups && groups.length > 0) {
                        const groupButtons = groups.map(group => [{ text: group.name, callback_data: `group_${group._id}` }]);
                        bot.editMessageText(`Mening guruhlarim:`, { chat_id: chatId, message_id: messageId, reply_markup: { inline_keyboard: [...groupButtons, [{ text: "Ortga qaytish", callback_data: "back" }]] } });
                    } else {
                        bot.editMessageText("Sizda guruhlar mavjud emas!", { chat_id: chatId, message_id: messageId, reply_markup: { inline_keyboard: [[{ text: "Ortga qaytish", callback_data: "back" }]] } });
                    }
                    break;
                case 'salary':
                    await getTeacherByChatIdFunction(chatId);
                    const salary = teachers[chatId].salaryPer;
                    const balance = teachers[chatId].balance.toLocaleString();
                    bot.editMessageText(`Ish haqi: ${salary}% \nJoriy balans: ${balance} UZS`, { chat_id: chatId, message_id: messageId, reply_markup: { inline_keyboard: [[{ text: "Ortga qaytish", callback_data: "back" }]] } });
                    break;
                case 'back':
                    bot.editMessageText("Quyidagi bo'limlardan birini tanlang:", { chat_id: chatId, message_id: messageId, reply_markup: { inline_keyboard: [[{ text: "Hisob ma'lumotlari", callback_data: "account" }], [{ text: "Mening guruhlarim", callback_data: "groups" }], [{ text: "Ish haqi", callback_data: "salary" }]] } });
                    break;
                default:
                    if (callbackData.startsWith('group_')) {
                        const groups = teachers[chatId].groups;
                        const groupId = callbackData.split('_')[1];
                        const group = groups.find(g => g._id.toString() === groupId);
                        if (group) {
                            const groupDetails = `Guruh nomi: ${group.name}\nKurs: ${group.course.title}\nO'quvchilar soni: ${group.students.length}`;
                            let attendanceButton = [];
                            const isLessonDay = group.course_days.find(day => day === today);
                            if (group.students.length > 0 && isLessonDay) {
                                attendanceButton = [{ text: "Davomat", callback_data: `attendance_${group._id}` }];
                            }
                            bot.editMessageText(groupDetails, { chat_id: chatId, message_id: messageId, reply_markup: { inline_keyboard: [...attendanceButton.length ? [attendanceButton] : [], [{ text: "Ortga qaytish", callback_data: "groups" }, { text: "Bosh menyu", callback_data: "back" }]] } });
                        } else {
                            bot.editMessageText("Guruh topilmadi!", { chat_id: chatId, message_id: messageId, reply_markup: { inline_keyboard: [[{ text: "Ortga qaytish", callback_data: "groups" }]] } });
                        }
                    } else if (callbackData.startsWith('attendance_')) {
                        const groups = teachers[chatId].groups;
                        const groupId = callbackData.split('_')[1];
                        const group = groups.find(g => g._id.toString() === groupId);
                        if (group) {
                            const studentButtons = group.students.map(student => [
                                { text: `${student.first_name} ${student.last_name}`, callback_data: `student_${student._id}` },
                                { text: '✔️', callback_data: `mark_${group._id}_${student._id}_was` },
                                { text: '❌', callback_data: `mark_${group._id}_${student._id}_not` }
                            ]);
                            bot.editMessageText("O'quvchilar ro'yxati:", { chat_id: chatId, message_id: messageId, reply_markup: { inline_keyboard: [...studentButtons, [{ text: "Ortga qaytish", callback_data: `group_${group._id}` }, { text: "Bosh menyu", callback_data: "back" }]] } });
                        }
                    } else if (callbackData.startsWith('student_')) {
                        const studentId = callbackData.split('_')[1];
                        const groups = teachers[chatId].groups;
                        let groupId = null;
                        let student = null;

                        // Find the student in any group
                        for (let group of groups) {
                            student = group.students.find(s => s._id.toString() === studentId);
                            groupId = group._id;
                            if (student) break;
                        }

                        if (student) {
                            bot.editMessageText(`O'quvchi ma'lumotlari:\nIsm: ${student.first_name + " " + student.last_name}\nTelefon: ${student.phoneNumber}`, {
                                chat_id: chatId,
                                message_id: messageId,
                                reply_markup: {
                                    inline_keyboard: [
                                        [
                                            { text: "Ortga qaytish", callback_data: `attendance_${groupId}` },
                                            { text: "Bosh menyu", callback_data: "back" }
                                        ]
                                    ]
                                }
                            });
                        } else {
                            bot.editMessageText("O'quvchi topilmadi!", { chat_id: chatId, message_id: messageId });
                        }
                    } else if (callbackData.startsWith('mark_')) {
                        const [_, groupId, studentId, status] = callbackData.split('_');
                        handleCheckboxChange(studentId, today, status, groupId, query);
                    } else {
                        bot.editMessageText("Noto'g'ri buyruq!", { chat_id: chatId, message_id: messageId, reply_markup: { inline_keyboard: [[{ text: "Ortga qaytish", callback_data: "back" }]] } });
                    }
                    break;
            }
        } catch (error) {
            winston.error(error.message);
            bot.sendMessage(chatId, "Nimadir xato! \nQayta urinib ko'ring 👉 /start");
        }
    }
});

// Har minutda o'qituvchiga eslatma jo'natilishini belgilash
cron.schedule('* * * * *', async () => {
    try {
        const { today, date } = await getCurrentDate();
        const currentTime = new Date(date).toTimeString().split(' ')[0];
        const { data } = await getAllTeachersFunction();

        for (const index in data) {
            const teacher = data[index];
            if (!teacher.chatId) continue;

            if (teacher.groups) {
                for (const group of teacher.groups) {
                    const lessonDay = group.course_days.includes(today);
                    const startTime = new Date(`1970-01-01T${group.start_time}:00Z`).getTime();
                    const currentTimeMs = new Date(`1970-01-01T${currentTime}Z`).getTime();
                    const tenMinutesMs = 10 * 60 * 1000;

                    if (lessonDay && ((startTime - currentTimeMs === tenMinutesMs) || (startTime - currentTimeMs === 0))) {
                        await sendAttendanceReminder(teacher, group);
                    }
                }
            }
        }
    } catch (error) {
        winston.error('Davomat olishni eslatishda xatolik:', error);
    }
});

module.exports = bot;