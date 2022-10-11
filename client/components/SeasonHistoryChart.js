import { useReduxViewModel } from '@resolve-js/redux';
import { useSelector } from 'react-redux';
import { Line } from 'react-chartjs-2';
import React, { useEffect } from 'react'
import {
  Chart as ChartJS,
  LineController,
  LineElement,
  PointElement,
  TimeScale,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

const plugin = {
  id: 'custom_canvas_background_color',
  beforeDraw: (chart) => {
    const {ctx} = chart;
    ctx.save();
    ctx.globalCompositeOperation = 'destination-over';
    ctx.fillStyle = 'lightGreen';
    ctx.fillRect(0, 0, chart.width, chart.height);
    ctx.restore();
  }
};

export const options = {
  responsive: true,
  plugins: [
    plugin
  ],
  scales: {
    x: {
      type: 'time',
      time: {
        tooltipFormat: 'lll'
      },
      title: {
        display: true,
        text: 'Date'
      },
      grid: {
        borderColor: '#FFFFFF',
        color: '#839496',
      }
    },
    y: {
      title: {
        display: true,
        text: 'value'
      },
      grid: {
        borderColor: '#FFFFFF',
        color: '#839496',
      }
    }
  }
};

const SeasonHistoryChart = ({id}) => 
{
  const {connect, dispose, selector: playersSelector} = useReduxViewModel({
    name: "SeasonRanks", 
    aggregateIds: [id],
  });

  const { data: players, playersStatus } = useSelector(playersSelector)

  useEffect(() => {
    connect()
    return () => {
      dispose()
    }
  }, [])


  return <Line options={options} data={getData(players)}></Line>
}

const getData = (players) => {
  const labels = Object.keys(players.rankhistory);
  const datasets = 
  labels.map((pid) => 
  (
    {
      label: pid,
      borderColor: "#FFFF00",
      data: players.rankhistory[pid].map((r) => ({ 
        x: new Date(r.timestamp),
        y: r.rank
      }))
    }
  ));

  return {
    labels: [],
    datasets
  }
  
}

export default SeasonHistoryChart