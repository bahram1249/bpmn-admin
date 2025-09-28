export default function HomePage() {
  return (
    <div className="container">
      <div>
        <h1>BPMN Admin</h1>
        <p>Use the navigation to manage Processes, Activities, Nodes, Requests, and Request States.</p>
        <p>
          Set your API Base URL and Bearer token in the header. Default base URL is
          http://localhost:3000
        </p>
      </div>
    </div>
  );
}
