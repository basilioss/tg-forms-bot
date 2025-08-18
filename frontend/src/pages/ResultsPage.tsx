import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import {
  AppRoot,
  List,
  Section,
  Cell,
  Spinner,
} from "@telegram-apps/telegram-ui";
import {
  Chart,
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const API = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000";

export default function ResultsPage() {
  const { id } = useParams();
  const [data, setData] = useState<any>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    fetch(`${API}/polls/${id}/results`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then(setData)
      .catch(console.error);
  }, [id]);

  useEffect(() => {
    if (!data) return;
    if (chartRef.current) chartRef.current.destroy();

    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;

    chartRef.current = new Chart(ctx, {
      type: "bar",
      data: {
        labels: data.results.map((r: any) => r.option),
        datasets: [
          {
            label: "Votes",
            data: data.results.map((r: any) => r.votes),
            backgroundColor: "#3390EC", // Telegram blue
          },
        ],
      },
      options: {
        responsive: true,
        scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
        plugins: {
          legend: { display: false },
        },
      },
    });
  }, [data]);

  return (
    <AppRoot>
      <List>
        <Section header={!data ? "Loading..." : data.question}>
          {!data ? (
            <Cell before={<Spinner />} multiline>
              Fetching results...
            </Cell>
          ) : (
            <Cell multiline>
              <canvas ref={canvasRef} height="160"></canvas>
            </Cell>
          )}
        </Section>
      </List>
    </AppRoot>
  );
}

