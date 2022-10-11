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

export const options = {
  responsive: true,
  plugins: {
    legend: {
      labels: {
        color: '#FFFFFF'
      }
    }
  },
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
        color: '#83949630',
      }
    },
    y: {
      title: {
        display: true,
        text: 'value'
      },
      grid: {
        borderColor: '#FFFFFF',
        color: '#83949630',
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

  const { data: seasonRanks, seasonRanksStatus } = useSelector(playersSelector)

  useEffect(() => {
    connect()
    return () => {
      dispose()
    }
  }, [])


  return <Line options={options} data={getData(seasonRanks)}></Line>
}

const colors = [
  "rgba(255, 255, 0, 0.5)",
  "rgba(255, 0, 0, 0.5)",
  "rgba(0, 255, 0, 0.5)",
  "rgba(0, 255, 255, 0.5)",
  "rgba(127, 255, 0, 0.5)",
  "rgba(0, 127, 255, 0.5)"
]

const getData = (players) => {
  const labels = Object.keys(players.rankhistory);
  var coloridx = 0;
  const datasets = 
  labels.map((pid) => {
    const color = colors[coloridx++ % colors.length];
    const dataset = {
      label: pid,
      borderColor: color,
      data: players.rankhistory[pid].map((r) => ({ 
        x: new Date(r.timestamp),
        y: r.rank
      }))
    };
    return dataset;
  });

  return {
    labels: [],
    datasets
  }
  
}

export default SeasonHistoryChart