const { EmbedBuilder } = require("discord.js");
require("dotenv/config");

/** @type {import('commandkit').CommandData} */
const data = {
    name: "weather",
    description: "หาข้อมูลสภาพอากาศ",
    options: [
        {
            name: "province",
            type: 3, 
            description: "ชื่อจังหวัด",
            required: true,
        },
        {
            name: "amphoe",
            type: 3, 
            description: "ชื่ออำเภอ",
            required: true,
        },
    ],
};

/** @param {import('commandkit').SlashCommandProps} param0 */
async function run({ interaction }) {

    // นำข้อมูลจาก province และ province
    const province = interaction.options.getString("province");
    const amphoe = interaction.options.getString("amphoe");
    
    // Fetch ข้อมูลจาก data
    const data = await fetchWeather(province, amphoe);
    
    if (data) {
        const location = data.location;
        const forecasts = data.forecasts;

        // สร้าง Embed ให้สวยงามจัดตามรุปแบบ Data
        const weatherEmbed = new EmbedBuilder()
            .setTitle(`🌤️ ข้อมูลสภาพอากาศจาก ${location.amphoe}, ${location.province}`)
            .setColor("Blue")
            .addFields(
                forecasts.map(forecast => ({
                    name: `📅 วันที่: ${new Date(forecast.time).toLocaleDateString()}`,
                    value: `🌡️ อุณหภูมิ: ${forecast.data.tc_max} °C\n💧 ความชื้นในอากาศ: ${forecast.data.rh}%`,
                    inline: true
                }))
            );

        // ส่ง Embed ไปยังผู้ใช้
        await interaction.reply({ embeds: [weatherEmbed] });
    } else {

        // หากไม่สามารถดึงข้อมูล
        await interaction.reply("❌ ไม่สามารถดึงข้อมูลได้หรือมีบางอย่างผิดพลาด");
    }
}

/** @type {import('commandkit').CommandOptions} */
const options = {
    // devOnly: true,
};

module.exports = { data, run, options };

// ฟังก์ชั่นในการ fetch ข้อมูลdata
async function fetchWeather(province, amphoe) {
    const url = `https://data.tmd.go.th/nwpapi/v1/forecast/location/daily/place?province=${encodeURIComponent(province)}&amphoe=${encodeURIComponent(amphoe)}&fields=tc_max,rh&duration=2`;
    
    try {
        const response = await fetch(url, {
            method: "GET",
            headers: {
                "accept": "application/json",
                "authorization": `Bearer ${process.env.TMD_API_TOKEN}`,
            },
        });

        const json = await response.json();

        // หากพบข้อมูล Json ของ "WeatherForecasts" และข้อมูลนั้นไม่ใช่ข้อมูลว่างเปล่า
        if (json.WeatherForecasts && json.WeatherForecasts.length > 0) {
            return await json.WeatherForecasts[0]; // Return หากพบข้อมูล
        } else {
            console.error("เกิดข้อผิดพลาดในการดึงข้อมูล", json);
            return null;
        }
    } catch (error) {
        console.error("Fetch error:", error);
        return null;
    }
}

