import { useEffect, useState } from "react";

const Test = () => {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const testAPI = async () => {
      try {
        const response = await fetch("https://api.openf1.org/v1/meetings?year=2025");
        const json = await response.json();
        setData(json);
      } catch (err: any) {
        setError(err.message);
      }
    };
    testAPI();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">API Test</h1>
      {error && <div className="text-red-500">Error: {error}</div>}
      {data && (
        <div>
          <p className="mb-2">Found {data.length} races</p>
          <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default Test;
