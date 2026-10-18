const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.post("/api/calculate-hourly-roofs", async (req, res) => {
  try {
    const { lat, lon, roofs } = req.body;

    if (!lat || !lon || !roofs || !Array.isArray(roofs) || roofs.length === 0) {
      return res.status(400).json({
        error: "Ungültige Eingabedaten. 'lat', 'lon' und ein 'roofs'-Array werden benötigt.",
      });
    }

    const totalHourlyGeneration = [];
    const rawData = [];

    const requests = roofs.map(async (roof) => {
      const url = `https://re.jrc.ec.europa.eu/api/v5_2/seriescalc?raddatabase=PVGIS-SARAH2&usehorizon=1&outputformat=json&pvcalculation=1&lat=${lat}&lon=${lon}&peakpower=${roof.kwp}&angle=${roof.slope}&aspect=${roof.azimuth}&loss=14`;

      const response = await axios.get(url);
      const hourlyData = response.data.outputs.hourly;
      const summaryHourlyData = {};

      for (let i = 0; i < hourlyData.length; i++) {
        let date = hourlyData[i].time.slice(4, 8);
        let hour = hourlyData[i].time.slice(-4);
        let currentP = hourlyData[i].P;

        if (!summaryHourlyData[date]) {
          summaryHourlyData[date] = {};
        }

        if (!summaryHourlyData[date][hour]) {
          summaryHourlyData[date][hour] = {
            p: currentP,
            yearCount: 1,
          };
        } else {
          summaryHourlyData[date][hour].p += currentP;
          summaryHourlyData[date][hour].yearCount += 1;
        }
      }

      for (const date in summaryHourlyData) {
        for (const hour in summaryHourlyData[date]) {
          const item = summaryHourlyData[date][hour];
          item.p = item.p / item.yearCount;
          delete item.yearCount;
        }
      }
      rawData.push(response.data.outputs.hourly);
      totalHourlyGeneration.push(summaryHourlyData);
    });

    await Promise.all(requests);

    res.json({
      success: true,
      rawData: rawData,
      allData: totalHourlyGeneration,
    });
  } catch (error) {
    console.error("Fehler bei der PVGIS-Stundenabfrage:", error.message);
    res.status(500).json({
      error: "Fehler bei der stündlichen Berechnung der PVGIS-Daten.",
      details: error.response?.data || error.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`PVGIS Hourly-Proxy-Server läuft auf http://localhost:${PORT}`);
});
