
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const VoltageChart = ({ from, to, interval = 10, refreshInterval = 60000 }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchVoltageData = async () => {
    try {
      const res = await axios.get('/sound-locator/api/esp32/esp32-data/voltage-chart', {
        params: { from, to, interval }
      });
      setData(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVoltageData();
    const intervalId = setInterval(fetchVoltageData, refreshInterval);
    return () => clearInterval(intervalId);
  }, [from, to, interval, refreshInterval]);

  if (loading) return <p>Loading voltage chart...</p>;

  // Separate solar and battery voltage
  const solarData = data.filter(d => d._id.type === 'solar_panel_voltage');
  const batteryData = data.filter(d => d._id.type === 'battery_voltage');

  const labels = solarData.map(d => new Date(d.timestamp).toLocaleString());

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Solar Voltage',
        data: solarData.map(d => d.avgValue),
        borderColor: 'orange',
        backgroundColor: 'rgba(255,165,0,0.2)',
      },
      {
        label: 'Battery Voltage',
        data: batteryData.map(d => d.avgValue),
        borderColor: 'blue',
        backgroundColor: 'rgba(0,0,255,0.2)',
      }
    ]
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: `Solar & Battery Voltage` },
    },
    scales: {
      y: { title: { display: true, text: 'Voltage (V)' } },
      x: { title: { display: true, text: 'Time' } }
    }
  };

  return <Line data={chartData} options={options} />;
};

export default VoltageChart;
