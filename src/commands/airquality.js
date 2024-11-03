const { EmbedBuilder } = require("discord.js");
require("dotenv/config");

/** @type {import('commandkit').CommandData} */
const data = {
    name: "airquality",
    description: "ตรวจสอบคุณภาพอากาศวันนี้",
    options: [
        {
            name: "city",
            type: 3, 
            description: "พิมพ์ชื่อเมืองที่คุณต้องการ",
            required: true,
        },
    ],
};

/** @param {import('commandkit').SlashCommandProps} param0 */
async function run({ interaction, client }) {
    // เก็บชื่อเมืองจากผู้ใช้
    const cityName = interaction.options.getString("city");

    // เชื่อมต่อ API ของ OpenAQ และ fetch
    const data = await fetchAirQuality(cityName);

    // หากมีข้อมูล
    if (data) {

        const { aqi, city, dominentpol, iaqi, time } = data;

        // ตรวจสอบมลพิษที่มีค่ามากที่สุด
        const mainPollutant = dominentpol.toUpperCase();

        // หาชื่อเมือง
        const cityInfo = city.name;

        // เวลา
        const timestamp = time.iso;

        // Embed สำหรับข้อมูลเบื้องต้น
        const generalInfoEmbed = new EmbedBuilder()
            .setDescription(`### 🌿 ข้อมูลคุณภาพอากาศของ **${cityInfo}**\n> \`\`🔎\`\` **ผลการค้นหา:** ${cityInfo}\n> \`\`🔰\`\` **ดัชนีคุณภาพอากาศ (AQI):** ${aqi}\n> \`\`🚬\`\` **สารมลพิษหลัก:** ${mainPollutant}\n> \`\`⌛\`\` **เวลา:** ${timestamp}`)
            .setColor('Aqua');

        // Embed สำหรับสถิติ
        const pollutantInfoEmbed = new EmbedBuilder()
            .addFields(
                { name: "🍂 ฝุ่น PM 2.5", value: iaqi.pm25?.v ? `\`\`${iaqi.pm25.v}\`\`` : "N/A", inline: true },
                { name: "🌵 ฝุ่น PM 10", value: iaqi.pm10?.v ? `\`\`${iaqi.pm10.v}\`\`` : "N/A", inline: true },
                { name: "💧 โอโซน (O3)", value: iaqi.o3?.v ? `\`\`${iaqi.o3.v}\`\`` : "N/A", inline: true },
                { name: "🍇 แก๊ส Nitrogen Dioxide (NO2)", value: iaqi.no2?.v ? `${iaqi.no2.v}` : "N/A", inline: true },
                { name: "⛅ จุดน้ำค้าง", value: iaqi.dew?.v ? `\`\`${iaqi.dew.v}°C\`\`` : "N/A", inline: true },
                { name: "💨 ซัลเฟอร์ไดออกไซด์ (SO2)", value: iaqi.so2?.v ? `${iaqi.so2.v}` : "N/A", inline: true },
                { name: "🔺 อุณหภูมิ", value: iaqi.t?.v ? `\`\`${iaqi.t.v} °C\`\`` : "N/A", inline: true },
                { name: "🍃 ความเร็วลม", value: iaqi.w?.v ? `\`\`${iaqi.w.v} m/s\`\`` : "N/A", inline: true }
            ).setColor('Aqua');

        // ส่ง Embed ไปยังผู้ใช้
        await interaction.reply({ embeds: [generalInfoEmbed, pollutantInfoEmbed] });
    } else {

        // หากไม่พบข้อมูลใน Data
        await interaction.reply("❌ ไม่สามารถดึงข้อมูลได้หรือมีบางอย่างผิดพลาด");
    }
}

/** @type {import('commandkit').CommandOptions} */
const options = {
    // devOnly: true,
};

module.exports = { data, run, options };

// ฟังก์ชั่นในการ fetch ข้อมูลdata
async function fetchAirQuality(cityName) {

    // สร้าง URl เพื่อเชื่อต่อ API
    const url = `https://api.waqi.info/feed/${encodeURIComponent(cityName)}/?token=${process.env.WAQI_API_TOKEN}`;
    try {

        // Fetch ข้อมูลจาก API
        const response = await fetch(url);

        // แปลงให้เป็ยข้อมูลจาก JSON
        const json = await response.json();

        // ตรวจสอบหากข้อมูลที่ส่งมานั้น OK
        if (json.status === "ok") {
            return json.data;
        } else {
            // หากมีบางอย่างผิดพลาดหรือไม่สามารถดึงข้อม฿ลได้
            console.error("เกิดข้อผิดพลาดในการดึงข้อมูล", json);
            return null;
        }
    } catch (error) {
        console.error("Fetch error:", error);
        return null;
    }
}
