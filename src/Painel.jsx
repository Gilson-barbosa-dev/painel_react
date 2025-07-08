
import { useEffect, useState } from "react";
import { Dialog } from "@headlessui/react";
import { Moon, Sun } from "lucide-react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend
);

export default function Painel() {
  const [tema, setTema] = useState("escuro");
  const [estrategias, setEstrategias] = useState([]);
  const [filtro, setFiltro] = useState("");
  const [ordenar, setOrdenar] = useState("lucro_total");
  const [graficoAberto, setGraficoAberto] = useState(false);
  const [dadosGrafico, setDadosGrafico] = useState({ labels: [], data: [] });
  const [magicSelecionado, setMagicSelecionado] = useState(null);

  useEffect(() => {
    fetch("https://apirobos-production.up.railway.app/dados")
      .then((res) => res.json())
      .then((data) => setEstrategias(data));
  }, []);

  const estrategiasFiltradas = estrategias
    .filter((e) =>
      e.magic.toString().includes(filtro) || e.ativo.toLowerCase().includes(filtro)
    )
    .sort((a, b) => {
      if (ordenar === "assertividade") return b.assertividade - a.assertividade;
      if (ordenar === "operacoes") return b.total_operacoes - a.total_operacoes;
      return b.lucro_total - a.lucro_total;
    });

  const abrirGrafico = (magic) => {
    setMagicSelecionado(magic);
    fetch(`https://apirobos-production.up.railway.app/historico_detalhado/${magic}`)
      .then((res) => res.json())
      .then((dados) => {
        let acumulado = 0;
        const labels = [];
        const data = [];
        for (const item of dados) {
          const lucro = parseFloat(item.lucro_total);
          acumulado += lucro;
          labels.push(item.data);
          data.push(acumulado);
        }
        setDadosGrafico({ labels, data });
        setGraficoAberto(true);
      });
  };

  return (
    <div className={tema === "claro" ? "bg-white text-black" : "bg-zinc-900 text-white"}>
      <div className="flex justify-between items-center p-4 max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold">Painel de Estratégias</h1>
        <button onClick={() => setTema(tema === "claro" ? "escuro" : "claro")}
          className="p-2 rounded-full bg-zinc-700 hover:bg-zinc-600">
          {tema === "claro" ? <Moon /> : <Sun />}
        </button>
      </div>

      <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-4 p-4">
        <input type="text" placeholder="Magic ou Ativo..."
          value={filtro} onChange={(e) => setFiltro(e.target.value.toLowerCase())}
          className="w-full md:w-1/2 p-2 rounded border" />
        <select value={ordenar} onChange={(e) => setOrdenar(e.target.value)}
          className="w-full md:w-1/2 p-2 rounded border">
          <option value="lucro_total">📈 Lucro Total</option>
          <option value="assertividade">✅ Assertividade</option>
          <option value="operacoes">📊 Operações</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto p-4">
        {estrategiasFiltradas.map((e) => (
          <div key={e.magic} className="p-4 rounded-xl border shadow bg-white/10 backdrop-blur">
            <h2 className="text-lg font-bold">Magic {e.magic}</h2>
            <p>📊 Ativo: {e.ativo}</p>
            <p>🕒 Início: {e.inicio}</p>
            <p>✅ Operações: {e.total_operacoes}</p>
            <p>✅ Vencedoras: {e.vencedoras}</p>
            <p>❌ Perdedoras: {e.perdedoras}</p>
            <p>🎯 Assertividade: {e.assertividade.toFixed(2)}%</p>
            <p>💰 Lucro Total: {e.lucro_total.toFixed(2)}</p>
            <button
              onClick={() => abrirGrafico(e.magic)}
              className="mt-2 bg-emerald-500 text-black px-3 py-1 rounded">
              📊 Ver Gráfico
            </button>
          </div>
        ))}
      </div>

      <Dialog open={graficoAberto} onClose={() => setGraficoAberto(false)} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <Dialog.Panel className="bg-white dark:bg-zinc-900 p-6 rounded-lg w-full max-w-2xl">
          <Dialog.Title className="text-lg font-bold mb-2">Gráfico: Magic {magicSelecionado}</Dialog.Title>
          <Line data={{
            labels: dadosGrafico.labels,
            datasets: [{
              label: "Lucro Acumulado",
              data: dadosGrafico.data,
              borderColor: tema === "claro" ? "#00c9a7" : "#00ffb3",
              backgroundColor: "transparent",
            }]
          }} options={{
            plugins: { legend: { labels: { color: tema === "claro" ? "#111" : "#fff" } } },
            scales: {
              x: { ticks: { color: tema === "claro" ? "#111" : "#fff" } },
              y: { ticks: { color: tema === "claro" ? "#111" : "#fff" } }
            }
          }} />
          <button onClick={() => setGraficoAberto(false)} className="mt-4 px-4 py-2 bg-red-500 text-white rounded">Fechar</button>
        </Dialog.Panel>
      </Dialog>
    </div>
  );
}
