import { useEffect, useState } from "react";

function App() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("http://localhost:4000/health")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Backend retornou erro");
        }

        return response.json();
      })
      .then(setData)
      .catch((err) => {
        setError(err.message);
      });
  }, []);

  return (
    <main>
      <h1>Docker Networking Lab</h1>

      <h2>Frontend</h2>

      <p>
        React + Vite rodando dentro de um container.
      </p>

      <h2>Backend</h2>

      {error && <p>Erro: {error}</p>}

      {data && (
        <pre>
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </main>
  );
}

export default App;