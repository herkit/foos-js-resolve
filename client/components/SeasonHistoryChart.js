import { useReduxReadModelSelector, useReduxViewModel } from '@resolve-js/redux';
import { useSelector } from 'react-redux';
import { Line } from 'react-chartjs-2';
import React, { useEffect, useState } from 'react'

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
import { ConfigService } from 'aws-sdk';

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
  const { status: playerStatus, data: players } = useReduxReadModelSelector("all-players")

  const [ graphData, setGraphData ] = useState({ labels: [], datasets: [] });
  const [ legends, setLegends ] = useState({});

  const { data: seasonRanks, status: seasonRanksStatus } = useSelector(playersSelector)

  useEffect(() => {
    connect()
    return () => {
      dispose()
    }
  }, [])

  useEffect(() => {
    console.log(playerStatus);
    if (playerStatus == "ready")
    {
      setLegends(Object.assign({}, ...players.map((p) => ({[p.id]: p.name}))));
    }
  }, [playerStatus])

  useEffect(() => {
    console.log("ranks", seasonRanksStatus);
    if (seasonRanksStatus == "ready")
    {
      let data = getData(seasonRanks, legends);
      console.log(data);
      setGraphData(data)
    }
  }, [legends, seasonRanksStatus])

  return graphData ? <Line options={options} data={graphData}></Line> : <></>
}

const colors = [
  "#A7D2CB",
  "#AAC4FF",
  "#ECC5FB",
  "#F2D388",
  "#FFB3B3",
  "#99C4C8",
  "#D0C9C0",
  "#FAFDD6"
]

const getData = (players, legends) => {
  const pids = Object.keys(players.rankhistory);
  var coloridx = 0;
  console.log(legends);
  const datasets = 
  pids.map((pid) => {
    const color = colors[coloridx++ % colors.length];
    const dataset = {
      label: legends[pid],
      borderColor: color,
      data: players.rankhistory[pid].map((r) => ({ 
        x: new Date(r.timestamp),
        y: r.rank
      }))
    };
    return dataset;
  });

  console.log(datasets);
  return {
    labels: [],
    datasets
  }
  
}

export default SeasonHistoryChart